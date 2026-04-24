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

PRIMARY FOCUS: THE PAST SHAPES THE PRESENT.
Spend the majority of the intake exploring the client's past and life history. Present struggles only make sense against the backdrop of their story. A good clinician knows: you cannot help someone unless you understand the formative experiences that made them who they are. Ask about:
- Childhood: What was the emotional atmosphere in their home growing up?
- Family dynamics: Who were they to their parents? Siblings? What roles did they play?
- Formative wounds: Betrayals, losses, bullying, neglect, moments that changed them
- Key relationships and how they ended
- Turning points: moments that shifted who they were becoming
- What they were like as a child before the world shaped them
- The stories their family told about them ("You've always been the responsible one")
- What they had to become vs. who they actually were

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
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a world-class clinical psychologist and psychoanalyst with 30 years of experience. You see patterns others miss. You understand people at a level that feels almost supernatural. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: `Analyze this intake conversation with extraordinary depth. Your analysis will be shown to the client as a "deep profile" — it should feel revelatory, like you dove into their brain and surfaced things they barely knew about themselves. Be specific, use their actual words and stories when possible. Never be generic.

CONVERSATION:
${conversationText}

Generate a JSON response with this EXACT structure. Be SPECIFIC to this person — no generic filler. If something wasn't discussed, use null rather than guessing. But for what WAS discussed, go DEEP.

{
  "display_name": "Their first name",
  "age": null,

  "life_context_document": "A 4-6 paragraph narrative written in second person ('You are...') that reads like the most insightful character study ever written about this person. Include specific details from their story. This should make them feel deeply understood — almost uncomfortably so.",

  "personality_archetype": {
    "label": "A compelling 2-4 word archetype label (e.g., 'The Quiet Architect', 'The Reluctant Caretaker', 'The Armored Romantic'). This should feel true and specific to them.",
    "description": "2-3 sentences explaining why this archetype fits them based on what they shared."
  },

  "the_headline": "One powerful sentence that captures who this person is at their core — the kind of line that makes them stop and think. Like a thesis statement for their psyche. Example: 'You've spent your whole life proving you don't need anyone, but the exhaustion of doing it alone is what finally brought you here.'",

  "revelations": [
    {
      "title": "Short label (3-6 words)",
      "insight": "A specific, revelatory insight about this person — something they might not fully realize about themselves. 2-3 sentences. Reference specific things they said. These should feel like 'how did you know that?' moments.",
      "evidence": "The specific thing they said or pattern you noticed that led to this insight."
    }
  ],

  "inner_world": {
    "core_belief": "The deepest belief they hold about themselves, often formed in childhood. One sentence.",
    "inner_critic_voice": "What their inner critic says to them — the specific message. Put it in quotes like dialogue.",
    "what_they_crave": "What they most deeply want but may struggle to ask for.",
    "what_they_avoid": "The feeling, situation, or truth they work hardest to avoid.",
    "superpower": "Their greatest psychological strength — the thing they don't give themselves enough credit for."
  },

  "attachment_patterns": {
    "primary_style": "secure/anxious-preoccupied/dismissive-avoidant/fearful-avoidant or null",
    "how_it_shows_up": "2-3 sentences about how this attachment style specifically manifests in THEIR life, referencing what they shared.",
    "in_relationships": "How this plays out in their romantic/close relationships specifically.",
    "origin_story": "Where this attachment pattern likely formed — what in their childhood/family created this."
  },

  "core_schemas": [
    {
      "schema": "Schema name (e.g., 'Abandonment', 'Unrelenting Standards', 'Defectiveness')",
      "how_it_runs_their_life": "2-3 sentences about how this schema specifically shows up in their daily life, decisions, and relationships. Be concrete.",
      "they_might_not_realize": "The subtle way this schema operates that they probably don't see."
    }
  ],

  "defense_mechanisms": [
    {
      "mechanism": "Name of the defense (e.g., 'Intellectualization', 'Humor as deflection')",
      "description": "How they specifically use this defense — with examples from the conversation."
    }
  ],

  "shadow_profile": {
    "rejected_self": "The part of themselves they push away or deny. What would they never want to be seen as?",
    "projection_pattern": "What they tend to criticize in others that might be a disowned part of themselves.",
    "the_mask": "The version of themselves they present to the world vs. who they are underneath."
  },

  "relational_patterns": {
    "role_in_relationships": "The role they consistently play (caretaker, fixer, performer, rebel, ghost, etc.) with specific evidence.",
    "conflict_style": "What they do when tension arises — fight, flee, freeze, or fawn? How specifically?",
    "vulnerability_capacity": "How capable are they of being truly vulnerable? What happens when they try?",
    "pattern_they_repeat": "A recurring relational pattern they may not fully see."
  },

  "emotional_fingerprint": {
    "dominant_emotions": ["The 2-3 emotions they seem to experience most often"],
    "suppressed_emotions": ["The 1-2 emotions they have the hardest time accessing or expressing"],
    "emotional_range": "narrow/moderate/wide — how much emotional range did they demonstrate?",
    "regulation_style": "How do they manage difficult emotions? Over-control, under-control, or healthy regulation?"
  },

  "existential_landscape": {
    "meaning_sources": "What gives their life meaning — or the absence they feel.",
    "authenticity_gap": "The distance between who they are and who they're performing as. What role are they playing that isn't them?",
    "core_fears": "Their deepest fears — not surface fears, but the existential ones.",
    "relationship_with_mortality": "How do they relate to the finite nature of life? Do they live urgently or avoid thinking about it?"
  },

  "behavioral_patterns": {
    "under_stress": "What they do when the pressure is on — their go-to coping behaviors.",
    "self_sabotage": "How they get in their own way. The specific pattern of self-sabotage, if any.",
    "energy_sources": "What genuinely recharges them vs. what they think recharges them.",
    "decision_making": "How they make decisions — gut, analysis, avoidance, or outsourcing to others?"
  },

  "presenting_concerns": ["Main issues that brought them here"],
  "strengths": ["Their genuine strengths — not platitudes, but real things you noticed"],
  "growth_edges": ["The specific areas where growth is possible — where the work is"],
  "goals": ["What they want to work on"],

  "somatic_behavioral": {
    "stress_location": "Where stress lives in their body",
    "sleep": null,
    "substances": null,
    "exercise": null,
    "energy": null
  },

  "therapeutic_approach_notes": "Based on this specific person, which therapeutic frameworks and specific interventions would be most effective and why? Be specific — not just 'CBT' but 'CBT for the catastrophizing pattern around work performance, combined with schema therapy to address the unrelenting standards schema that drives their perfectionism.'"
}

CRITICAL: Generate 4-7 revelations. Each one should be specific enough that this person would say 'wow, that's exactly right.' Never be vague or generic. If you only have enough data for fewer insights, that's fine — quality over quantity. Use null for any field where the conversation didn't provide enough information.`,
        },
      ],
    })

    const extracted = JSON.parse(extractionResponse.choices[0].message.content)

    // Save to profile
    const questionnaire = {
      life_context_document: extracted.life_context_document,
      personality_archetype: extracted.personality_archetype,
      the_headline: extracted.the_headline,
      revelations: extracted.revelations,
      inner_world: extracted.inner_world,
      attachment_patterns: extracted.attachment_patterns,
      core_schemas: extracted.core_schemas,
      defense_mechanisms: extracted.defense_mechanisms,
      shadow_profile: extracted.shadow_profile,
      relational_patterns: extracted.relational_patterns,
      emotional_fingerprint: extracted.emotional_fingerprint,
      existential_landscape: extracted.existential_landscape,
      behavioral_patterns: extracted.behavioral_patterns,
      presenting_concerns: extracted.presenting_concerns,
      strengths: extracted.strengths,
      growth_edges: extracted.growth_edges,
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
      profile: extracted,
    })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    res.status(500).json({ error: 'Failed to generate your profile' })
  }
})

module.exports = router
