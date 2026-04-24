import { supabase } from './_lib/supabase.js'
import { openai } from './_lib/claude.js'
import { verifyAuth } from './_middleware/auth.js'

export const config = { maxDuration: 30 }

const EXTRACTION_PROMPT = `You are a clinical intake analyst. A therapy client has written down something they want their AI therapist to remember about them. Your job is to STRUCTURE this raw input into a well-categorized memory node that can be visualized on a timeline and in a mind map.

Return JSON with this EXACT structure:

{
  "title": "3-6 word title capturing the essence",
  "summary": "1-2 sentence neutral summary (preserves emotional core)",
  "category": "family | relationship | loss | trauma | identity | health | career | substance | belief | achievement | childhood | body | other",
  "subcategory": "Optional specific tag (e.g. 'father', 'divorce', 'grad school')",
  "emotional_valence": -1 to 1 (negative to positive),
  "emotional_intensity": 0 to 1,
  "dominant_emotion": "one-word emotion",
  "estimated_age_at_event": number or null (if the memory refers to a past event and an age can be inferred or extracted),
  "time_period": "childhood | adolescence | young_adulthood | adulthood | recent | ongoing | unknown",
  "people_mentioned": ["list", "of", "people"] or [],
  "themes": ["3-5 thematic tags like 'abandonment', 'perfectionism', 'loss', 'caregiving'"],
  "connects_to_categories": ["any other categories this memory relates to, for mind map edges"],
  "clinical_significance": "One sentence on why this matters psychologically",
  "ai_callback_hints": [
    "Two to four short phrases the AI could use to gently reference this in future conversations, in second person. Example: 'You mentioned your dad died when you were 12'"
  ]
}

Be precise. Preserve the client's voice. Never invent details. If a field is unknowable from the text, use null or an empty array.`

const GAP_PROMPT = `You are a clinical intake analyst reviewing a client's self-taught memory bank. Your job is to identify what's MISSING from their profile so their AI therapist can fill in the gaps.

Return a JSON object:
{
  "gap_questions": [
    {
      "question": "Natural question phrased like a therapist would ask it",
      "category": "which category this fills — family/relationship/loss/trauma/identity/health/career/substance/belief/achievement/childhood/body/other",
      "reason": "One sentence on why this gap matters for psychological understanding"
    }
  ]
}

Rules:
- Generate 4-8 questions — the most useful ones to ask next.
- Mix across time periods (childhood, adolescence, adulthood, recent) if there are gaps in the timeline.
- Avoid duplicating topics already well-covered. Look at what CATEGORIES and LIFE STAGES the client has memories in, and target the thin ones.
- Each question should feel specific and curious, not like a form field. Example: "What was your relationship with your mom like when you were a teenager?" not "Tell me about your mother."
- Prefer questions that would unlock rich narrative answers, not one-word responses.
- Phrase questions so the client could naturally type a paragraph in reply.`

export default async function handler(req, res) {
  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // GET = suggested gap questions
  if (req.method === 'GET') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('questionnaire, display_name')
        .eq('id', user.id)
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
            content: `Client profile snippet:\n${q.life_context_document ? q.life_context_document.slice(0, 2000) : '(none)'}\n\nMemory bank (${memories.length} memories):\n${JSON.stringify(summary, null, 2)}\n\nWhat should we ask next to fill in the gaps?`,
          },
        ],
      })
      const parsed = JSON.parse(r.choices[0].message.content)
      return res.json(parsed)
    } catch (e) {
      console.error('Gap questions error:', e)
      return res.status(500).json({ error: e.message })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

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

    // Load current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('questionnaire')
      .eq('id', user.id)
      .single()

    const q = profile?.questionnaire || {}
    const memories = q.user_trained_memories || []
    const newMemory = {
      id: crypto.randomUUID(),
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
      .eq('id', user.id)

    return res.json({ success: true, memory: newMemory })
  } catch (error) {
    console.error('Train memory error:', error)
    return res.status(500).json({ error: error.message || 'Failed to process memory' })
  }
}
