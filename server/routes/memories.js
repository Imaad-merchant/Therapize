const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')

// List user's saved memories
router.get('/', async (req, res) => {
  const userId = req.user.id
  try {
    const { data, error } = await supabase
      .from('saved_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('List memories error:', error)
    res.status(500).json({ error: 'Failed to list memories' })
  }
})

// Save a new memory
router.post('/', async (req, res) => {
  const userId = req.user.id
  const { session_id, source_type, payload, note } = req.body

  if (!source_type || !payload) {
    return res.status(400).json({ error: 'source_type and payload are required' })
  }

  try {
    const { data, error } = await supabase
      .from('saved_memories')
      .insert({
        user_id: userId,
        session_id: session_id || null,
        source_type,
        payload,
        note: note || null,
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Save memory error:', error)
    res.status(500).json({ error: 'Failed to save memory' })
  }
})

// Update a saved memory (note only)
router.patch('/:id', async (req, res) => {
  const userId = req.user.id
  const { id } = req.params
  const { note } = req.body

  try {
    const { data, error } = await supabase
      .from('saved_memories')
      .update({ note })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Update memory error:', error)
    res.status(500).json({ error: 'Failed to update memory' })
  }
})

// Delete a saved memory
router.delete('/:id', async (req, res) => {
  const userId = req.user.id
  const { id } = req.params

  try {
    const { error } = await supabase
      .from('saved_memories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    console.error('Delete memory error:', error)
    res.status(500).json({ error: 'Failed to delete memory' })
  }
})

module.exports = router
