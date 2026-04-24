import { supabase } from './_lib/supabase.js'
import { verifyAuth } from './_middleware/auth.js'

export default async function handler(req, res) {
  const user = await verifyAuth(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('saved_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.json(data || [])
    } catch (error) {
      console.error('List memories error:', error)
      return res.status(500).json({ error: 'Failed to list memories' })
    }
  }

  if (req.method === 'POST') {
    const { session_id, source_type, payload, note } = req.body
    if (!source_type || !payload) {
      return res.status(400).json({ error: 'source_type and payload are required' })
    }
    try {
      const { data, error } = await supabase
        .from('saved_memories')
        .insert({
          user_id: user.id,
          session_id: session_id || null,
          source_type,
          payload,
          note: note || null,
        })
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } catch (error) {
      console.error('Save memory error:', error)
      return res.status(500).json({ error: 'Failed to save memory' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
