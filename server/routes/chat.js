const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { buildSystemPrompt, createChatCompletion, openai } = require('../lib/claude')

router.post('/', async (req, res) => {
  const { session_id, message } = req.body
  const userId = req.user.id

  if (!session_id || !message) {
    return res.status(400).json({ error: 'session_id and message are required' })
  }

  try {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Fetch existing messages for context
    const { data: existingMessages = [] } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    const isGreeting = message === '__GREETING__'

    // Save user message (unless it's a greeting trigger)
    if (!isGreeting) {
      await supabase.from('messages').insert({
        session_id,
        user_id: userId,
        role: 'user',
        content: message,
      })
    }

    // Build messages for OpenAI
    const systemPrompt = buildSystemPrompt(profile)
    const chatMessages = [
      ...existingMessages,
      ...(isGreeting
        ? [
            {
              role: 'user',
              content:
                'This is the start of a new session. Please greet me warmly and ask how I am doing today. Reference what you know about me from my profile to make it personal.',
            },
          ]
        : [{ role: 'user', content: message }]),
    ]

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const stream = await createChatCompletion(systemPrompt, chatMessages)
    let fullContent = ''

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || ''
      if (text) {
        fullContent += text
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`)
      }
    }

    res.write(
      `data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`
    )
    res.end()

    // Save assistant message
    await supabase.from('messages').insert({
      session_id,
      user_id: userId,
      role: 'assistant',
      content: fullContent,
    })

    // Generate session title after first exchange
    if (existingMessages.length <= 2 && !isGreeting) {
      try {
        const titleResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 30,
          messages: [
            {
              role: 'user',
              content: `Generate a brief 3-5 word title for a therapy session about: "${message}". Return ONLY the title, no quotes or punctuation.`,
            },
          ],
        })
        const title = titleResponse.choices[0].message.content.trim()
        await supabase
          .from('sessions')
          .update({ title })
          .eq('id', session_id)
      } catch (e) {
        console.error('Title generation error:', e)
      }
    }
  } catch (error) {
    console.error('Chat error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    } else {
      res.write(
        `data: ${JSON.stringify({ type: 'error', content: 'Stream error occurred' })}\n\n`
      )
      res.end()
    }
  }
})

module.exports = router
