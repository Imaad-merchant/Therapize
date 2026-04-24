import { supabase } from '../_lib/supabase.js'
import { openai } from '../_lib/claude.js'
import { verifyAuth } from '../_middleware/auth.js'

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

  const { session_id } = req.body

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
}
