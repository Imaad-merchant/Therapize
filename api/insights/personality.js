import { supabase } from '../lib/supabase.js'
import { openai } from '../lib/claude.js'
import { verifyAuth } from '../middleware/auth.js'

export const config = {
  maxDuration: 30,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await verifyAuth(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('summary, themes, mood_score')
      .eq('user_id', user.id)
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

    for (const insight of insights) {
      await supabase.from('insights').upsert(
        {
          user_id: user.id,
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
}
