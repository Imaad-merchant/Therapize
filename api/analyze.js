import { supabase } from './_lib/supabase.js'
import { openai } from './_lib/claude.js'
import { verifyAuth } from './_middleware/auth.js'

// Deduplicate by lowercased string representation
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
    ].slice(-20) // keep last 20 session snapshots
  }
  merged.last_auto_sync = new Date().toISOString()
  return merged
}

export const config = {
  maxDuration: 30,
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
  }
}

RULES:
- The live_narration is the star — make it the richest, most human part. Specific. Thoughtful. Conversational.
- Be SPECIFIC to what was actually said. No generic psychology.
- Emotional spectrum has exactly 4 emotions summing to 100.
- Active patterns: 2-4 items max.
- Apply the 5-step protocol: gather, identify patterns, apply theory silently, draw insights, offer targeted reflection.
- Use deep frameworks: Jungian shadow, attachment, schema therapy, existential, IFS, object relations.
- profile_updates must be populated on every call — even thin observations count. They will be automatically merged into the master profile.
- Even short conversations reveal something. Work with what you have.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await verifyAuth(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { session_id } = req.body
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' })
  }

  try {
    const { data: messages = [] } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    const { data: profile } = await supabase
      .from('profiles')
      .select('questionnaire, display_name')
      .eq('id', user.id)
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
      .eq('user_id', user.id)

    // Auto-merge profile_updates into the master profile — no button needed
    try {
      const pu = insights.profile_updates
      if (pu && q) {
        const mergedQ = autoMergeProfile(q, pu)
        await supabase
          .from('profiles')
          .update({
            questionnaire: mergedQ,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }
    } catch (mergeErr) {
      console.error('Auto-merge profile error:', mergeErr)
    }

    // Also save snapshot to history
    await supabase.from('insight_snapshots').insert({
      session_id,
      user_id: user.id,
      insights,
      message_count: messages.length,
    })

    res.json(insights)
  } catch (error) {
    console.error('Analyze error:', error)
    res.status(500).json({ error: 'Failed to analyze conversation' })
  }
}
