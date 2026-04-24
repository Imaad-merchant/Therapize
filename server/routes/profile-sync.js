const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { openai } = require('../lib/claude')

const MERGE_PROMPT = `You are a clinical psychoanalyst updating a client's master psychological profile with new insights from a recent therapy session.

You are given:
1. The client's EXISTING profile (their current questionnaire/life context)
2. NEW brain language insights from the session that just happened
3. (Optionally) Saved memories the client bookmarked

Your job: return an UPDATED profile JSON that intelligently merges the new material into the existing profile. Rules:

- PRESERVE existing fields unless there is strong evidence to revise them.
- ENRICH arrays (revelations, core_schemas, defense_mechanisms, strengths, goals, behavioral_patterns) by APPENDING new items only if they are genuinely new or meaningfully different. Never duplicate.
- REFINE narrative fields (life_context_document, personality_archetype, shadow_material, emotional_fingerprint) by integrating the new insights — rewrite them to be more accurate and complete, not longer for its own sake.
- If a new insight contradicts something old, use the new insight (more recent data wins) but keep the explanation grounded.
- Stay within the EXISTING schema of the profile.

Return a JSON object with this structure:
{
  "questionnaire": { ...the full updated questionnaire object... },
  "changes_summary": "2-3 sentence description of what you changed and why"
}

The questionnaire should match the existing structure exactly — same keys, same nested shape. Fill gaps where the new insights reveal something the profile didn't capture.`

router.post('/', async (req, res) => {
  const userId = req.user.id
  const { session_id } = req.body

  try {
    // Load existing profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('questionnaire, display_name')
      .eq('id', userId)
      .single()

    if (!profile?.questionnaire) {
      return res.status(400).json({ error: 'No existing profile to update' })
    }

    let recentInsights = []
    try {
      const query = supabase.from('insight_snapshots').select('insights')
      if (session_id) query.eq('session_id', session_id)
      query
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(session_id ? 5 : 10)
      const { data: snapshots } = await query
      recentInsights = (snapshots || []).map((s) => s.insights)
    } catch (e) {
      console.log('insight_snapshots not available')
    }

    if (recentInsights.length === 0 && session_id) {
      const { data: sessionRow } = await supabase
        .from('sessions')
        .select('brain_insights')
        .eq('id', session_id)
        .eq('user_id', userId)
        .single()
      if (sessionRow?.brain_insights) {
        recentInsights = [sessionRow.brain_insights]
      }
    }

    let memories = []
    try {
      const { data } = await supabase
        .from('saved_memories')
        .select('source_type, payload')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
      memories = data || []
    } catch (e) {
      console.log('saved_memories not available')
    }

    let conversationExcerpt = ''
    if (session_id) {
      const { data: messages = [] } = await supabase
        .from('messages')
        .select('role, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(50)
      conversationExcerpt = messages
        .map((m) => `${m.role === 'user' ? 'CLIENT' : 'THERAPIST'}: ${m.content}`)
        .join('\n\n')
        .slice(0, 8000)
    }

    if (
      recentInsights.length === 0 &&
      memories.length === 0 &&
      !conversationExcerpt
    ) {
      return res.status(400).json({
        error:
          'No new insights or conversation to merge into profile. Chat for a bit first.',
      })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: MERGE_PROMPT },
        {
          role: 'user',
          content: `EXISTING PROFILE:\n${JSON.stringify(profile.questionnaire, null, 2)}\n\n---\n\nNEW BRAIN INSIGHTS (most recent first):\n${JSON.stringify(recentInsights, null, 2)}\n\n---\n\nSAVED MEMORIES:\n${JSON.stringify(memories, null, 2)}\n\n---\n\nCONVERSATION EXCERPT:\n${conversationExcerpt || '(none)'}`,
        },
      ],
    })

    const result = JSON.parse(response.choices[0].message.content)
    const mergedQuestionnaire = {
      ...result.questionnaire,
      last_profile_sync: new Date().toISOString(),
    }

    // Persist
    await supabase
      .from('profiles')
      .update({
        questionnaire: mergedQuestionnaire,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    res.json({
      success: true,
      changes_summary: result.changes_summary,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Profile sync error:', error)
    res.status(500).json({ error: 'Failed to sync profile' })
  }
})

module.exports = router
