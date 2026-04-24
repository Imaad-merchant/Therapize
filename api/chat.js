import { supabase } from './_lib/supabase.js'
import { buildSystemPrompt, createChatStream, openai } from './_lib/claude.js'
import { verifyAuth } from './_middleware/auth.js'

export const config = {
  maxDuration: 60,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await verifyAuth(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { session_id, message, chat_mode } = req.body
  if (!session_id || !message) {
    return res.status(400).json({ error: 'session_id and message are required' })
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: existingMessages = [] } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    const isGreeting = message === '__GREETING__'

    if (!isGreeting) {
      await supabase.from('messages').insert({
        session_id,
        user_id: user.id,
        role: 'user',
        content: message,
      })
    }

    if (chat_mode) {
      await supabase
        .from('sessions')
        .update({ chat_mode })
        .eq('id', session_id)
        .eq('user_id', user.id)
    }

    let systemPrompt = buildSystemPrompt(profile)

    if (chat_mode === 'solution') {
      systemPrompt += `\n\nMODE: SOLUTION-FOCUSED
The client has indicated they want actionable guidance right now. While still being empathetic and grounded in deep psychology:
- Lead with practical frameworks, exercises, and concrete next steps
- Use Socratic questions that move toward clarity and action
- Offer behavioral experiments, reframes, and specific techniques
- Still validate first, but move faster toward illumination and tools
- Structure responses with clear takeaways when appropriate
- Think CBT behavioral activation, DBT skills, Stoic exercises, motivational interviewing`
    } else if (chat_mode === 'challenger') {
      systemPrompt += `\n\nMODE: CHALLENGER — RIGOROUS REFLECTION
The client wants you to be their intellectual sparring partner, NOT their emotional comforter. Your role is to reveal blind spots, faulty assumptions, and emotional distortions. You value truth over comfort, clarity over reassurance.

YOUR APPROACH:
- Be calm, intelligent, and precise — challenging without hostility
- Do not agree reflexively. Do not validate claims before examining them
- When the client makes a claim, interrogate it with these questions (use the right ones for the moment, don't mechanically ask all five):
  1. What evidence supports this belief?
  2. What evidence challenges it?
  3. What emotional need might be shaping this view?
  4. Who benefits from you continuing to believe this?
  5. What would it cost you to be wrong about this?
- Surface cognitive biases directly: confirmation bias, sunk cost, fundamental attribution error, etc.
- Name defensive moves: intellectualization, deflection, projection, rationalization
- Call out avoidance, vagueness, and performative self-awareness
- BUT: still operate with care. You are a rigorous guide, not a cruel critic. Challenge the IDEA, never the PERSON.
- Crisis protocol still supersedes this — if someone is in acute distress, drop the challenge mode and hold them.
- This mode is for when they are stable and want to be sharpened, not soothed.`
    } else {
      systemPrompt += `\n\nMODE: DEEP LISTENING & ORIENTING
The client wants to be heard and understood right now. They're not looking for solutions — they're looking for someone to truly get it:
- Prioritize reflection, validation, and emotional attunement
- Sit with them in what they're feeling. Don't rush to fix.
- Use depth psychology: what's the feeling beneath the feeling?
- Mirror back with precision: "What I hear underneath all of this is..."
- Ask the one question that opens the door wider
- Think psychodynamic, Jungian, humanistic, person-centered`
    }

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

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const stream = await createChatStream(systemPrompt, chatMessages)
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
      user_id: user.id,
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
}
