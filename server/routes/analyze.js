const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { openai } = require('../lib/claude')

function addUnique(existing = [], incoming = [], keyFn = (v) => v) {
  const out = [...existing]
  const seen = new Set(existing.map((v) => keyFn(v).toString().toLowerCase()))
  for (const v of incoming) {
    if (!v) continue
    const k = keyFn(v).toString().toLowerCase()
    if (!seen.has(k)) {
      out.push(v)
      seen.add(k)
    }
  }
  return out
}

function autoMergeProfile(existing, updates) {
  const merged = { ...existing }
  if (updates.new_revelations?.length) {
    merged.revelations = addUnique(
      existing.revelations || [],
      updates.new_revelations,
      (r) => (typeof r === 'string' ? r : r.title || '')
    )
  }
  if (updates.schemas_surfaced?.length) {
    merged.core_schemas = addUnique(
      existing.core_schemas || [],
      updates.schemas_surfaced.map((s) => (typeof s === 'string' ? { schema: s } : s)),
      (s) => (typeof s === 'string' ? s : s.schema || '')
    )
  }
  if (updates.defenses_observed?.length) {
    merged.defense_mechanisms = addUnique(
      existing.defense_mechanisms || [],
      updates.defenses_observed.map((d) => (typeof d === 'string' ? { mechanism: d } : d)),
      (d) => (typeof d === 'string' ? d : d.mechanism || '')
    )
  }
  if (updates.strengths_observed?.length) {
    merged.strengths = addUnique(existing.strengths || [], updates.strengths_observed)
  }
  if (updates.growth_edges_observed?.length) {
    merged.growth_edges = addUnique(
      existing.growth_edges || [],
      updates.growth_edges_observed
    )
  }
  if (updates.history_clues?.length) {
    merged.history_notes = addUnique(existing.history_notes || [], updates.history_clues)
  }
  if (updates.notes_for_master_profile) {
    const priorNotes = existing.session_notes || []
    merged.session_notes = [
      ...priorNotes,
      { note: updates.notes_for_master_profile, at: new Date().toISOString() },
    ].slice(-20)
  }
  merged.last_auto_sync = new Date().toISOString()
  return merged
}

const ANALYZE_PROMPT = `You are a skilled psychoanalyst silently observing a therapy conversation in real-time. You produce a CONVERSATIONAL, NARRATIVE analysis — like the private running monologue of a clinician as they listen. The bulk of your output is the live_narration field — written in your own first-person voice, thoughtful, exploratory, specific to THIS client in THIS moment.

Return a JSON object with this EXACT structure:

{
  "live_narration": "3-6 short paragraphs of your first-person analytic observation. Write as if you're thinking out loud while listening. Be specific. Reference exact things they said. Speculate about what's beneath. Trace connections between what they said in different messages. This is the main content — write it well and give it real substance. Use markdown: **bold** for key concepts, line breaks between paragraphs, > blockquotes for direct reflection, and short bullet lists when useful.",
  "emotional_state": {
    "primary": "The dominant emotion right now (one word)",
    "secondary": "Secondary emotion (one word)",
    "valence": -1 to 1,
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
      "description": "One sentence",
      "framework": "Schema Therapy / Attachment / Jungian / IFS / etc.",
      "confidence": 0-1,
      "type": "pattern | defense | schema | archetype"
    }
  ],
  "themes": ["theme1", "theme2", "theme3"],
  "key_insight": {
    "title": "The Big Thing Happening",
    "body": "2-3 sentences of deep interpretation",
    "quote": "Exact quote from user that reveals this"
  },
  "cognitive_map": {
    "core_belief": "The belief driving this",
    "trigger": "What activated it",
    "behavioral_response": "How they're responding",
    "hidden_need": "What they actually need"
  },
  "session_trajectory": {
    "direction": "deepening | circling | avoiding | breaking_through | processing",
    "note": "One sentence on where this is heading"
  },
  "profile_updates": {
    "new_revelations": [
      { "title": "...", "insight": "...", "evidence": "Exact quote or behavior" }
    ],
    "schemas_surfaced": ["..."],
    "defenses_observed": ["..."],
    "strengths_observed": ["..."],
    "growth_edges_observed": ["..."],
    "history_clues": ["Any past detail they mentioned worth saving to their life story"],
    "notes_for_master_profile": "2-3 sentence summary of what should be added to this person's master psychological profile based on THIS conversation — phrased in the same tone as the existing profile."
  },
  "suggested_next_questions": [
    "3-5 questions the AI would ask to deepen understanding or fill timeline gaps. 8-20 words each. Phrased as a therapist would say them."
  ],
  "auto_captured_memories": [
    {
      "text": "First-person concrete fact the client stated. Example: 'I got bullied in middle school for being quiet'",
      "title": "3-6 word title",
      "category": "family | relationship | loss | trauma | identity | health | career | substance | belief | achievement | childhood | body | other",
      "subcategory": "Optional",
      "emotional_valence": -1 to 1,
      "emotional_intensity": 0 to 1,
      "dominant_emotion": "one word",
      "estimated_age_at_event": number or null,
      "time_period": "childhood | adolescence | young_adulthood | adulthood | recent | ongoing | unknown",
      "people_mentioned": [],
      "themes": ["3-5 tags"],
      "connects_to_categories": [],
      "clinical_significance": "One sentence"
    }
  ]
}

AUTO-CAPTURED MEMORIES: extract concrete biographical facts the client explicitly stated. Write them first-person as if the client typed them on /train. Only facts (events, people, ages, relationships, history). Skip vague emotions. Max 3 per analysis. Empty array if none new.

CRITICAL — EVERY FIELD MUST BE POPULATED ON EVERY CALL:
- live_narration: ALWAYS at least 2 paragraphs, even for very short conversations.
- emotional_state: ALWAYS all 4 emotions summing to 100.
- active_patterns: ALWAYS at least 2 items.
- themes: ALWAYS at least 3.
- key_insight: ALWAYS present.
- cognitive_map: ALWAYS all four fields.
- session_trajectory: ALWAYS a direction.
- profile_updates: ALWAYS populate.

Never return null, empty strings, or empty arrays. When data is thin, lean on the profile context. When profile is thin, lean on psychological priors.

RULES:
- The live_narration is the star — rich, specific, conversational.
- Be SPECIFIC to what was said. Reference direct quotes when possible.
- Emotional spectrum has exactly 4 emotions summing to 100.
- Minimum 2 active patterns.
- Apply the 5-step protocol silently.
- Use deep frameworks: Jungian shadow, attachment, schema therapy, existential, IFS, object relations.
- profile_updates will be auto-merged into the master profile.`

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
      max_tokens: 2400,
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

    // Auto-merge profile_updates + auto-captured memories into master profile
    try {
      const pu = insights.profile_updates
      const captured = Array.isArray(insights.auto_captured_memories)
        ? insights.auto_captured_memories
        : []
      if ((pu && q) || captured.length > 0) {
        let mergedQ = pu ? autoMergeProfile(q, pu) : { ...q }

        if (captured.length > 0) {
          const existing = mergedQ.user_trained_memories || []
          const seen = new Set(
            existing
              .map((m) => (m.text || '').toLowerCase().slice(0, 80))
              .filter(Boolean)
          )
          const crypto = require('crypto')
          const newOnes = captured
            .filter((c) => c && c.text && c.text.trim().length > 3)
            .filter((c) => !seen.has((c.text || '').toLowerCase().slice(0, 80)))
            .map((c) => ({
              id: crypto.randomUUID(),
              text: c.text,
              added_at: new Date().toISOString(),
              source: 'auto_from_chat',
              session_id,
              title: c.title || null,
              category: c.category || 'other',
              subcategory: c.subcategory || null,
              emotional_valence: c.emotional_valence ?? 0,
              emotional_intensity: c.emotional_intensity ?? 0.5,
              dominant_emotion: c.dominant_emotion || null,
              estimated_age_at_event: c.estimated_age_at_event ?? null,
              time_period: c.time_period || 'unknown',
              people_mentioned: Array.isArray(c.people_mentioned) ? c.people_mentioned : [],
              themes: Array.isArray(c.themes) ? c.themes : [],
              connects_to_categories: Array.isArray(c.connects_to_categories)
                ? c.connects_to_categories
                : [],
              clinical_significance: c.clinical_significance || null,
            }))
          if (newOnes.length > 0) {
            mergedQ.user_trained_memories = [...newOnes, ...existing]
          }
        }

        await supabase
          .from('profiles')
          .update({
            questionnaire: mergedQ,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
      }
    } catch (mergeErr) {
      console.error('Auto-merge profile error:', mergeErr)
    }

    res.json(insights)
  } catch (error) {
    console.error('Analyze error:', error)
    res.status(500).json({ error: 'Failed to analyze conversation' })
  }
})

module.exports = router
