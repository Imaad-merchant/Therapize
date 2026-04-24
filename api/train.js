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

const GAP_PROMPT = `You are a seasoned psychotherapist designing the questions you'd ask a client in their first few sessions to build a complete picture of them.

Draw from the classic intake battery that every trained clinician learns — the questions therapists, psychoanalysts, and psychologists actually ask in initial evaluations. Cover the standard territory:

THE STANDARD INTAKE MAP:
1. Family of origin: who raised them, what was the emotional climate, who was each parent as a person
2. Siblings + birth order + role in the family
3. Childhood atmosphere (happy, tense, chaotic, lonely, supervised, neglected)
4. Parental attunement — were they seen, heard, soothed as a kid
5. First wounds / earliest memories of feeling unsafe, unseen, or hurt
6. School experience and social life in childhood / adolescence
7. Bullying, being othered, or being a standout kid
8. Adolescence — who they were becoming, what changed
9. First significant romantic relationship and how it shaped them
10. Past relationships that ended badly and what they learned / didn't
11. Losses: deaths, breakups, ruptures, moves, estrangements
12. Mental health history — self or family (anxiety, depression, OCD, trauma, etc.)
13. Substance use / recovery / compulsions
14. Major medical events, chronic illness, body-image history
15. Education path + career trajectory + relationship to work
16. Turning points — "the year that changed everything"
17. Spiritual / religious / philosophical orientation
18. Current stressors and who/what supports them
19. How conflict usually goes for them
20. What they're most afraid of, most ashamed of, most proud of

Return JSON:
{
  "gap_questions": [
    {
      "question": "Natural question phrased like a therapist would say it in session",
      "category": "family | relationship | loss | trauma | identity | health | career | substance | belief | achievement | childhood | body | other",
      "reason": "One short phrase on why this is a core intake question"
    }
  ]
}

Rules:
- Generate 5-8 questions pulled from the standard intake battery above.
- Target areas where the client's existing memories are THIN or absent — don't duplicate topics they've already covered.
- If the profile is totally empty, start with the classics: childhood atmosphere, parents as people, formative wounds, who they were as a kid.
- Each question should be something a therapist would actually ask — warm, open-ended, inviting narrative.
- Examples of the tone: "What was your mom like when you were young — not as a mom, but as a person?" / "Who was the first person who broke your heart?" / "When you think about your childhood house, what's the smell or sound that comes back first?" / "Was there a year in your life where something shifted — where you became who you are now?"
- Never ask yes/no questions.
- Never ask vague "tell me about yourself" questions — always specific.`

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
