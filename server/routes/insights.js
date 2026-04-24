const express = require('express')
const router = express.Router()
const { openai } = require('../lib/claude')
const { supabase } = require('../lib/supabase')

router.post('/session-summary', async (req, res) => {
  const { session_id } = req.body
  const userId = req.user.id

  try {
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (!messages || messages.length < 2) {
      return res.json({ summary: null, mood_score: null, themes: [] })
    }

    const conversation = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: `Analyze this therapy session conversation and return a JSON object with exactly these fields:
- "summary": A 2-3 sentence summary of what was discussed and any breakthroughs or insights
- "mood_score": A number from 1-10 representing the client's overall mood during the session (1=very distressed, 10=very positive)
- "themes": An array of 2-4 key themes discussed (e.g., ["work stress", "anxiety", "coping strategies"])

Conversation:
${conversation}`,
        },
      ],
    })

    const result = JSON.parse(response.choices[0].message.content)

    await supabase
      .from('sessions')
      .update({
        summary: result.summary,
        mood_score: result.mood_score,
        themes: result.themes,
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', session_id)

    res.json(result)
  } catch (error) {
    console.error('Session summary error:', error)
    res.status(500).json({ error: 'Failed to generate session summary' })
  }
})

router.post('/personality', async (req, res) => {
  const userId = req.user.id

  try {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('summary, themes, mood_score')
      .eq('user_id', userId)
      .not('summary', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!sessions || sessions.length < 2) {
      return res.json([])
    }

    const sessionData = sessions
      .map(
        (s, i) =>
          `Session ${i + 1}: ${s.summary} (Mood: ${s.mood_score}/10, Themes: ${(s.themes || []).join(', ')})`
      )
      .join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Respond with a JSON object containing an "insights" array.',
        },
        {
          role: 'user',
          content: `Based on these therapy session summaries, generate personality insights. Return a JSON object with an "insights" array, where each item has:
- "type": one of "personality", "behavior", "pattern", "growth"
- "title": short title (3-6 words)
- "description": 1-2 sentence insight
- "confidence": number 0-1 indicating how confident this insight is

Generate 3-5 insights.

Sessions:
${sessionData}`,
        },
      ],
    })

    const parsed = JSON.parse(response.choices[0].message.content)
    const insights = parsed.insights || parsed

    // Upsert insights
    for (const insight of insights) {
      await supabase.from('insights').upsert(
        {
          user_id: userId,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,title' }
      )
    }

    res.json(insights)
  } catch (error) {
    console.error('Personality insight error:', error)
    res.status(500).json({ error: 'Failed to generate insights' })
  }
})

module.exports = router
