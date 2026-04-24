const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { openai } = require('../lib/claude')

const ANALYZE_PROMPT = `You are a clinical psychoanalyst observing a therapy conversation in real-time. Your job is to produce a structured psychological analysis of what's happening RIGHT NOW in this conversation.

Return a JSON object with this EXACT structure:

{
  "emotional_state": {
    "primary": "The dominant emotion right now (one word)",
    "secondary": "Secondary emotion (one word)",
    "valence": -1 to 1 (negative to positive),
    "intensity": 0 to 1,
    "spectrum": [
      { "emotion": "name", "value": 0-100 },
      { "emotion": "name", "value": 0-100 },
      { "emotion": "name", "value": 0-100 },
      { "emotion": "name", "value": 0-100 }
    ]
  },
  "active_patterns": [
    {
      "id": "unique-slug",
      "label": "Short pattern name",
      "description": "One sentence explaining what you see",
      "framework": "Which framework this comes from (e.g., Schema Therapy, Attachment, Jungian)",
      "confidence": 0-1,
      "type": "pattern" | "defense" | "schema" | "archetype"
    }
  ],
  "themes": ["theme1", "theme2", "theme3"],
  "key_insight": {
    "title": "The Big Thing Happening",
    "body": "2-3 sentences of deep psychological interpretation. What is the person REALLY saying beneath the surface? Use clinical depth but accessible language.",
    "quote": "Exact quote from user that reveals this"
  },
  "cognitive_map": {
    "core_belief": "The underlying belief driving this conversation",
    "trigger": "What activated this belief",
    "behavioral_response": "How they're responding to the trigger",
    "hidden_need": "What they actually need but aren't saying"
  },
  "session_trajectory": {
    "direction": "deepening" | "circling" | "avoiding" | "breaking_through" | "processing",
    "note": "One sentence on where this conversation is heading"
  }
}

RULES:
- Be SPECIFIC to what was actually said. No generic psychology.
- The emotional spectrum must have exactly 4 emotions that add up to 100.
- Active patterns should be 2-4 items max. Quality over quantity.
- The key insight should feel like a revelation — something the person hasn't articulated themselves.
- Use deep frameworks: Jungian shadow, attachment theory, schema therapy, existential psychology, IFS, object relations. Not surface-level CBT.
- If there aren't enough messages to analyze deeply, still provide what you can observe. Even a greeting reveals something.`

router.post('/', async (req, res) => {
  const { session_id } = req.body
  const userId = req.user.id

  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' })
  }

  try {
    // Fetch conversation
    const { data: messages = [] } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    // Fetch profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('questionnaire, display_name')
      .eq('id', userId)
      .single()

    const q = profile?.questionnaire || {}
    let profileContext = ''
    if (q.life_context_document) {
      profileContext = `\n\nKNOWN ABOUT THIS PERSON:\n${q.life_context_document}\nAttachment: ${q.attachment_patterns?.primary_style || 'unknown'}\nSchemas: ${(q.core_schemas || []).join(', ') || 'unknown'}\nDefense mechanisms: ${(q.defense_mechanisms || []).join(', ') || 'unknown'}`
    }

    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'CLIENT' : 'THERAPIST'}: ${m.content}`)
      .join('\n\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: ANALYZE_PROMPT + profileContext },
        {
          role: 'user',
          content: `Analyze this conversation:\n\n${conversationText}`,
        },
      ],
    })

    const insights = JSON.parse(response.choices[0].message.content)

    // Persist latest insights to session
    await supabase
      .from('sessions')
      .update({ brain_insights: insights })
      .eq('id', session_id)
      .eq('user_id', userId)

    // Also save a snapshot to the history
    await supabase.from('insight_snapshots').insert({
      session_id,
      user_id: userId,
      insights,
      message_count: messages.length,
    })

    res.json(insights)
  } catch (error) {
    console.error('Analyze error:', error)
    res.status(500).json({ error: 'Failed to analyze conversation' })
  }
})

module.exports = router
