import { supabase } from '../_lib/supabase.js'

export async function verifyAuth(req) {
  const authHeader = req.headers.authorization || req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null
    return { id: user.id, email: user.email }
  } catch {
    return null
  }
}
