const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { openai } = require('../lib/claude')

const EXTRACTION_PROMPT = `You are a clinical intake analyst. A therapy client has written down something they want their AI therapist to remember about them. Your job is to STRUCTURE this raw input into a well-categorized memory node that can be visualized on a timeline and in a mind map.

Return JSON with this EXACT structure:

{
  "title": "3-6 word title capturing the essence",
  "summary": "1-2 sentence neutral summary (preserves emotional core)",
  "category": "family | relationship | loss | trauma | identity | health | career | substance | belief | achievement | childhood | body | other",
  "subcategory": "Optional specific tag (e.g. 'father', 'divorce', 'grad school')",
  "emotional_valence": -1 to 1,
  "emotional_intensity": 0 to 1,
  "dominant_emotion": "one-word emotion",
  "estimated_age_at_event": number or null,
  "time_period": "childhood | adolescence | young_adulthood | adulthood | recent | ongoing | unknown",
  "people_mentioned": [] or [names],
  "themes": ["3-5 thematic tags"],
  "connects_to_categories": ["any other categories this memory relates to"],
  "clinical_significance": "One sentence",
  "ai_callback_hints": [
    "Two to four short phrases the AI could use to reference this"
  ]
}

Preserve the client's voice. Never invent details.`

const GAP_PROMPT = `You are a seasoned psychotherapist designing the questions you'd ask a client in their first few sessions to build a complete picture of them.

Draw from the classic intake battery that every trained clinician learns. Cover the standard territory:
- Family of origin, caregivers as people, sibling dynamics, birth order
- Childhood atmosphere, parental attunement, first wounds
- School + social life as a kid, bullying or being different
- Adolescence — who they were becoming, what shifted
- First heartbreak, past relationships that shaped them
- Losses: deaths, breakups, moves, estrangements
- Mental health history (self + family), substance use, medical events
- Career path, relationship to work
- Turning points, spiritual / philosophical orientation
- Current stressors, what conflict looks like for them
- What they fear most, what they're most ashamed of, most proud of

Return JSON:
{
  "gap_questions": [
    { "question": "Natural therapist-tone question", "category": "family|relationship|loss|trauma|identity|health|career|substance|belief|achievement|childhood|body|other", "reason": "Short phrase why this is a core intake question" }
  ]
}

Rules:
- 5-8 questions pulled from the standard intake battery above.
- Target areas where memories are THIN or absent; never duplicate covered topics.
- If profile is empty, start with classics: childhood atmosphere, parents as people, formative wounds, who they were as a kid.
- Warm, open-ended, narrative-inviting. Never yes/no. Never vague.
- Example tones: "What was your mom like when you were young — not as a mom, but as a person?" / "Who was the first person who broke your heart?"`

router.get('/', async (req, res) => {
  const userId = req.user.id
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('questionnaire, display_name')
      .eq('id', userId)
      .single()

    const q = profile?.questionnaire || {}
    const memories = q.user_trained_memories || []
    const summary = memories.map((m) => ({
      title: m.title,
      category: m.category,
      time_period: m.time_period,
      age: m.estimated_age_at_event,
      themes: m.themes,
    }))

    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: GAP_PROMPT },
        {
          role: 'user',
          content: `Client profile:\n${q.life_context_document ? q.life_context_document.slice(0, 2000) : '(none)'}\n\nMemories (${memories.length}):\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
    })
    const parsed = JSON.parse(r.choices[0].message.content)
    res.json(parsed)
  } catch (e) {
    console.error('Gap questions error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  const userId = req.user.id
  const { text } = req.body
  if (!text || text.trim().length < 3) {
    return res.status(400).json({ error: 'text is required' })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: `Memory to structure:\n\n"""${text}"""` },
      ],
    })

    const extracted = JSON.parse(response.choices[0].message.content)

    const { data: profile } = await supabase
      .from('profiles')
      .select('questionnaire')
      .eq('id', userId)
      .single()

    const q = profile?.questionnaire || {}
    const memories = q.user_trained_memories || []
    const newMemory = {
      id: require('crypto').randomUUID(),
      text,
      added_at: new Date().toISOString(),
      ...extracted,
    }
    const updated = [newMemory, ...memories]

    await supabase
      .from('profiles')
      .update({
        questionnaire: { ...q, user_trained_memories: updated },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    res.json({ success: true, memory: newMemory })
  } catch (error) {
    console.error('Train memory error:', error)
    res.status(500).json({ error: error.message || 'Failed to process memory' })
  }
})

module.exports = router
