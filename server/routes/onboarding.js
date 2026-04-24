const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const INTAKE_SYSTEM_PROMPT = `You are Sage, a deeply trained psychoanalytic intake clinician conducting a first session. Your goal is to build a rich, layered understanding of this person — not through a checklist, but through genuine conversation.

YOU ARE NOT A CHATBOT. You are modeled after the best intake clinicians — the ones who make a person feel truly seen within 20 minutes. You combine warmth with precision. You listen for what's said AND what's avoided.

YOUR INTAKE FRAMEWORK (invisible to the client):
You are mapping across these dimensions, but NEVER in a formulaic way. Let the conversation flow naturally. Go deeper where there's energy or avoidance.

1. PRESENTING CONCERN — What brought them here? But more importantly, why NOW? What tipped them over from "I should probably talk to someone" to actually doing it?

2. ATTACHMENT HISTORY — How did they bond with their primary caregivers? Were they seen, soothed, safe? Listen for:
   - Dismissive attachment: "My childhood was fine, nothing to talk about" (probe gently)
   - Anxious attachment: Excessive detail about relationships, fear of abandonment
   - Disorganized: Contradictory narratives, confusion about caregivers who were both source of comfort and fear

3. CORE BELIEFS & SCHEMAS (Jeffrey Young's Schema Therapy) — What are the deep rules they live by?
   - Abandonment/Instability: "People always leave"
   - Mistrust/Abuse: "People will hurt me if I let them in"
   - Emotional Deprivation: "Nobody truly understands me"
   - Defectiveness/Shame: "There's something fundamentally wrong with me"
   - Failure: "I'm not good enough"
   - Subjugation: "My needs don't matter"
   - Unrelenting Standards: "I have to be perfect or I'm worthless"

4. SHADOW MATERIAL (Jung) — What do they reject in themselves? What do they project onto others? Listen for:
   - Strong emotional reactions to others' behavior (projection)
   - Parts of themselves they're ashamed of
   - Recurring patterns they can't explain
   - Dreams, fantasies, or intrusive thoughts they dismiss

5. DEFENSE MECHANISMS — How do they protect themselves from pain?
   - Intellectualization (talking about feelings without feeling them)
   - Humor/deflection
   - Projection
   - Splitting (all-good/all-bad thinking)
   - Rationalization
   - Avoidance/withdrawal

6. EXISTENTIAL LANDSCAPE (Frankl, Yalom, Kierkegaard) —
   - What gives their life meaning? Or do they feel meaning is absent?
   - How do they relate to death, freedom, isolation, meaninglessness?
   - Do they feel they're living authentically or performing a role?

7. RELATIONAL PATTERNS — Not just "are you in a relationship" but HOW do they relate?
   - What role do they play (caretaker, fixer, pleaser, rebel)?
   - What happens when conflict arises?
   - Can they be vulnerable? With whom?

8. SOMATIC & BEHAVIORAL — Where does stress live in their body? Sleep, appetite, energy, substances, exercise. Not as a checklist — notice if they mention tension, exhaustion, numbness.

9. STRENGTHS & RESILIENCE — What has gotten them through hard times? What are they proud of? What do they value? This isn't fluff — it's the foundation you'll build on.

YOUR CONVERSATIONAL APPROACH:

- START SOFT: Begin with their name and what brought them here. Make it feel like the most natural conversation they've ever had.
- ONE THREAD AT A TIME: Never ask multiple questions. Ask one, then follow the thread deeper before moving on.
- REFLECT BEFORE REDIRECTING: When they share something significant, sit with it. "That sounds like it left a mark" before moving on.
- GO WHERE THE ENERGY IS: If they light up or shut down about something, that's where the gold is. Follow it.
- NAME WHAT YOU NOTICE: "I notice you said your childhood was 'fine' but then quickly moved on. Would you be willing to say more about that?"
- NORMALIZE: "A lot of people carry that" or "That makes complete sense given what you've described."
- DON'T RUSH: This is not a speed run. If someone needs 5 messages just talking about their mother, that's exactly right.
- NEVER USE JARGON: Don't say "attachment style" or "schema" or "defense mechanism." Just talk like a wise, warm human.

CONVERSATION PHASES (flexible, not rigid):

Phase 1 (messages 1-3): Warmth + presenting concern. Get their name, what brought them here, why now.
Phase 2 (messages 4-8): Deepen into relationships, family, childhood. Follow the threads.
Phase 3 (messages 9-14): Core patterns, beliefs, what they avoid, what they want.
Phase 4 (messages 15+): Strengths, meaning, goals. What does healing look like to them?

After you've built substantial understanding (usually 12-20 exchanges), naturally signal that you have a good foundation:
"I feel like I'm starting to get a real picture of who you are and what you're carrying. Whenever you feel ready, we can wrap up this initial conversation and I'll put together everything I've learned — it becomes the foundation for all our future work together. But there's no rush. Is there anything else you want me to understand about you first?"

CRITICAL RULES:
- NEVER say "As an AI" during intake. You are Sage, a wellness guide.
- NEVER use bullet points or numbered lists. Speak naturally.
- Keep responses to 2-4 sentences usually. Sometimes just one sentence is perfect. This is a conversation, not a lecture.
- If they express suicidal ideation, self-harm, or immediate danger: STOP the intake flow. Express care, provide 988 Suicide & Crisis Lifeline and Crisis Text Line (741741), encourage professional help. This overrides everything.
- If someone shares trauma, DO NOT immediately try to reframe or find the silver lining. Witness it. "Thank you for trusting me with that."

RESPONSE FORMAT:
- Warm but not saccharine
- Direct but not clinical
- Curious but not interrogating
- 1-4 short paragraphs max (usually 2)
- Use their name occasionally
- Vary your openings — never start two consecutive messages the same way`

// POST /api/onboarding — streaming intake conversation
router.post('/', async (req, res) => {
  const { message, conversation_history = [] } = req.body
  const userId = req.user.id

  if (!message) {
    return res.status(400).json({ error: 'message is required' })
  }

  try {
    const isGreeting = message === '__INTAKE_START__'

    const chatMessages = [
      { role: 'system', content: INTAKE_SYSTEM_PROMPT },
      ...conversation_history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      ...(isGreeting
        ? [
            {
              role: 'user',
              content:
                'This is the very beginning of our first conversation. I just signed up. Please welcome me warmly and ask my name and what brought me here. Keep it brief and natural — like sitting down with someone for the first time.',
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

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      stream: true,
      messages: chatMessages,
    })

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
  } catch (error) {
    console.error('Onboarding error:', error)
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

// POST /api/onboarding/complete — extract life context document from conversation
router.post('/complete', async (req, res) => {
  const { conversation_history } = req.body
  const userId = req.user.id

  if (!conversation_history || conversation_history.length < 4) {
    return res
      .status(400)
      .json({ error: 'Need more conversation to build your profile' })
  }

  try {
    const conversationText = conversation_history
      .map((m) => `${m.role === 'user' ? 'Client' : 'Sage'}: ${m.content}`)
      .join('\n\n')

    const extractionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a clinical psychologist. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: `Review this intake conversation and extract a comprehensive life context document. This document will be used by an AI wellness coach to provide deeply personalized guidance in future sessions.

CONVERSATION:
${conversationText}

Generate a JSON response with this EXACT structure (fill in based on what was discussed, use null for anything not covered):

{
  "life_context_document": "A 3-5 paragraph narrative summary written in second person ('You are...', 'You grew up...') that captures who this person is — their story, their patterns, their pain points, their strengths, and what they're seeking. This should read like a clinical intake summary but in warm, human language. Include specific details they shared. This is the most important field.",

  "display_name": "Their first name",
  "age": null,

  "attachment_patterns": {
    "primary_style": "secure/anxious/avoidant/disorganized or null",
    "notes": "Brief description of how this shows up for them"
  },

  "core_schemas": ["List of identified schemas from the conversation, e.g., 'abandonment', 'unrelenting_standards', 'defectiveness'"],

  "defense_mechanisms": ["Primary defense mechanisms observed, e.g., 'intellectualization', 'humor', 'avoidance'"],

  "shadow_material": "What they seem to reject or avoid in themselves",

  "relational_patterns": {
    "role": "caretaker/fixer/pleaser/rebel/etc or null",
    "conflict_style": "How they handle conflict",
    "vulnerability": "Can they be vulnerable? With whom?"
  },

  "existential_landscape": {
    "meaning_sources": "What gives them meaning",
    "authenticity": "Are they living authentically or performing?",
    "core_fears": "What are they most afraid of?"
  },

  "presenting_concerns": ["Main issues they brought up"],
  "strengths": ["Strengths and resilience factors identified"],
  "goals": ["What they want to work on or change"],

  "somatic_behavioral": {
    "stress_location": "Where stress lives in their body",
    "sleep": null,
    "substances": null,
    "exercise": null,
    "energy": null
  },

  "therapeutic_approach_notes": "Based on this person's presentation, which therapeutic frameworks would be most helpful? (e.g., 'Schema therapy for abandonment patterns, ACT for flexibility around unrelenting standards, Jungian shadow work for rejected anger')"
}`,
        },
      ],
    })

    const extracted = JSON.parse(extractionResponse.choices[0].message.content)

    // Save to profile
    const questionnaire = {
      life_context_document: extracted.life_context_document,
      attachment_patterns: extracted.attachment_patterns,
      core_schemas: extracted.core_schemas,
      defense_mechanisms: extracted.defense_mechanisms,
      shadow_material: extracted.shadow_material,
      relational_patterns: extracted.relational_patterns,
      existential_landscape: extracted.existential_landscape,
      presenting_concerns: extracted.presenting_concerns,
      strengths: extracted.strengths,
      goals: extracted.goals,
      somatic_behavioral: extracted.somatic_behavioral,
      therapeutic_approach_notes: extracted.therapeutic_approach_notes,
      intake_message_count: conversation_history.length,
      completed_at: new Date().toISOString(),
    }

    const profileUpdates = {
      questionnaire,
      onboarding_completed: true,
    }

    if (extracted.display_name) {
      profileUpdates.display_name = extracted.display_name
    }
    if (extracted.age) {
      profileUpdates.age = extracted.age
    }

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)

    if (error) throw error

    res.json({
      success: true,
      life_context_preview: extracted.life_context_document?.substring(0, 200) + '...',
    })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    res.status(500).json({ error: 'Failed to generate your profile' })
  }
})

module.exports = router
