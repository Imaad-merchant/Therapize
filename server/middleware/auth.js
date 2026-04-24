const { supabase } = require('../lib/supabase')

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    req.user = { id: user.id, email: user.email }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

module.exports = { authMiddleware }
