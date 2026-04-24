const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { buildSystemPrompt, createChatCompletion, openai } = require('../lib/claude')
const { buildPersonaPrompt } = require('../lib/personas')

router.post('/', async (req, res) => {
  const { session_id, message, chat_mode, persona_id } = req.body
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

    // Persist chat mode + persona on session
    const sessionUpdates = {}
    if (chat_mode) sessionUpdates.chat_mode = chat_mode
    if (persona_id) sessionUpdates.persona_id = persona_id
    if (Object.keys(sessionUpdates).length > 0) {
      await supabase
        .from('sessions')
        .update(sessionUpdates)
        .eq('id', session_id)
        .eq('user_id', userId)
    }

    // Build messages for OpenAI
    let systemPrompt = buildSystemPrompt(profile)

    // Inject persona specialist training
    if (persona_id && persona_id !== 'sage') {
      systemPrompt += buildPersonaPrompt(persona_id)
    }

    // Append mode-specific instructions
    // Visual formatting instructions for ALL modes
    systemPrompt += `\n\n--- RESPONSE FORMATTING (apply to every response) ---
People don't like reading long paragraphs. Your responses must be VISUALLY SCANNABLE.

REQUIRED formatting:
- Use **bold** for key emotional concepts, names of patterns, and critical phrases
- Use bullet points (•) for lists of 2+ items (thoughts, feelings, options, steps)
- Use numbered lists (1. 2. 3.) when sequence matters
- Use > blockquotes for reflective mirrors ("What I hear underneath this is...")
- Use ### mini-headers for multi-part responses (e.g., "### What's happening" / "### What to try")
- Use --- horizontal rules to separate distinct sections
- Use short paragraphs — max 2-3 sentences before a break
- Use emoji sparingly for emotional anchors: 🌊 for feelings, 🧭 for direction, 💭 for thoughts, ⚡ for insights (max 1-2 per response)

AVOID:
- Walls of text — break them up
- Academic jargon without a bullet explaining it
- Responses longer than 150 words unless the client asked for depth
- Starting with "I" — vary openings

Keep the warmth and depth — just organize it for the eye.
--- END FORMATTING ---`

    if (chat_mode === 'solution') {
      systemPrompt += `\n\nMODE: SOLUTION-FOCUSED
The client has indicated they want actionable guidance right now. While still being empathetic and grounded in deep psychology:
- Lead with practical frameworks, exercises, and concrete next steps
- Use Socratic questions that move toward clarity and action
- Offer behavioral experiments, reframes, and specific techniques
- Still validate first, but move faster toward illumination and tools
- Structure responses with clear takeaways when appropriate
- Think CBT behavioral activation, DBT skills, Stoic exercises, motivational interviewing`
    } else if (chat_mode === 'all') {
      systemPrompt += `\n\nMODE: ALL-IN-ONE — INTEGRATIVE
The client wants everything: deep listening, practical solutions, AND rigorous challenge — all woven together intelligently.

YOUR APPROACH (use all three, structured with headers):
1. **### What I'm hearing** — start with empathic reflection and validation (listening mode)
2. **### The pattern I notice** — surface the blind spot, assumption, or defense operating (challenger mode)
3. **### What to try** — give 2-3 concrete tools, exercises, or behavioral experiments (solution mode)

Read the moment. If the client is in raw pain, weight heavier toward listening. If they're stuck in a loop, weight toward challenge. If they want action, weight toward solutions. But always touch all three layers when the moment allows.
Crisis protocol still supersedes — drop everything and hold them if they're in acute distress.`
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
