import { supabase } from '../_lib/supabase.js'
import { openai } from '../_lib/claude.js'
import { verifyAuth } from '../_middleware/auth.js'

export const config = {
  maxDuration: 60,
}

const MERGE_PROMPT = `You are a clinical psychoanalyst updating a client's master psychological profile with new insights from a recent therapy session.

You MUST produce visible, substantive updates. A successful sync ALWAYS results in meaningfully enriched content.

RULES:
1. PRESERVE the entire existing questionnaire structure and keys. Do NOT drop fields.
2. ENRICH arrays (revelations, core_schemas, defense_mechanisms, strengths, goals, behavioral_patterns, growth_edges, presenting_concerns) — append at least 1-3 new entries per sync based on the session data, unless genuinely nothing new emerged. Never duplicate existing items.
3. For new revelations, use this shape: { "title": "...", "insight": "...", "evidence": "Exact quote or behavior from session" }.
4. REFINE narrative fields (life_context_document, personality_archetype, shadow_material, shadow_profile, emotional_fingerprint, inner_world) by weaving in new session observations. These should read DIFFERENTLY after the update, not just longer.
5. Update relational_patterns, existential_landscape, and attachment_patterns with any new observations.
6. Recent data wins when contradictions arise.

Return a JSON object with EXACTLY this structure:
{
  "questionnaire": {
    ...the full updated questionnaire object with all existing keys preserved and enriched...
  },
  "changes_summary": "Specific 2-3 sentence description of what was added/revised",
  "changelog": [
    { "field": "revelations", "change": "added", "summary": "Added revelation about X" },
    { "field": "personality_archetype", "change": "refined", "summary": "Added reference to Y pattern observed in session" }
  ]
}

CRITICAL: Your changelog should list 3-8 specific changes. If you cannot find 3 changes to make, you are not looking hard enough at the session data.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { session_id } = req.body

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('questionnaire, display_name')
      .eq('id', user.id)
      .single()

    if (!profile?.questionnaire) {
      return res.status(400).json({ error: 'No existing profile to update' })
    }

    let recentInsights = []
    // Try insight_snapshots table (may not exist if migration not run)
    try {
      const query = supabase.from('insight_snapshots').select('insights')
      if (session_id) {
        query.eq('session_id', session_id)
      }
      query.eq('user_id', user.id).order('created_at', { ascending: false }).limit(session_id ? 5 : 10)
      const { data: snapshots } = await query
      recentInsights = (snapshots || []).map((s) => s.insights)
    } catch (e) {
      console.log('insight_snapshots not available, using current session brain_insights')
    }

    // Fallback: use the current session's brain_insights if snapshot history empty
    if (recentInsights.length === 0 && session_id) {
      const { data: sessionRow } = await supabase
        .from('sessions')
        .select('brain_insights')
        .eq('id', session_id)
        .eq('user_id', user.id)
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      memories = data || []
    } catch (e) {
      console.log('saved_memories not available')
    }

    // Allow sync if there is ANY source of new insight data, including raw conversation
    let conversationExcerpt = ''
    if (session_id) {
      const { data: msgs = [] } = await supabase
        .from('messages')
        .select('role, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(50)
      conversationExcerpt = msgs
        .map((m) => `${m.role === 'user' ? 'CLIENT' : 'THERAPIST'}: ${m.content}`)
        .join('\n\n')
        .slice(0, 8000)
    }

    if (
      recentInsights.length === 0 &&
      memories.length === 0 &&
      !conversationExcerpt
    ) {
      return res
        .status(400)
        .json({ error: 'No new insights or conversation to merge into profile. Chat for a bit first.' })
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

    await supabase
      .from('profiles')
      .update({
        questionnaire: mergedQuestionnaire,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    res.json({
      success: true,
      changes_summary: result.changes_summary,
      changelog: result.changelog || [],
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Profile sync error:', error)
    res.status(500).json({ error: 'Failed to sync profile' })
  }
}
