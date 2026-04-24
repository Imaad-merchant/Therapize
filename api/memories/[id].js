import { supabase } from '../lib/supabase.js'
import { verifyAuth } from '../middleware/auth.js'

export default async function handler(req, res) {
  const user = await verifyAuth(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  if (req.method === 'PATCH') {
    const { note } = req.body
    try {
      const { data, error } = await supabase
        .from('saved_memories')
        .update({ note })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } catch (error) {
      console.error('Update memory error:', error)
      return res.status(500).json({ error: 'Failed to update memory' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('saved_memories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      return res.json({ success: true })
    } catch (error) {
      console.error('Delete memory error:', error)
      return res.status(500).json({ error: 'Failed to delete memory' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
