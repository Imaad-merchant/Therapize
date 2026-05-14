import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Set them in your environment (e.g. Vercel project settings) and redeploy.',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

export function isNetworkError(error) {
  if (!error) return false
  const msg = typeof error === 'string' ? error : error.message || ''
  return (
    error.name === 'TypeError' && /fetch/i.test(msg) ||
    /Failed to fetch/i.test(msg) ||
    /NetworkError/i.test(msg) ||
    /ERR_NAME_NOT_RESOLVED/i.test(msg) ||
    /ERR_INTERNET_DISCONNECTED/i.test(msg)
  )
}

export function friendlyAuthError(error) {
  if (isNetworkError(error)) {
    return "Can't reach the authentication service. Please check your internet connection or try again in a moment."
  }
  return error?.message || 'Something went wrong. Please try again.'
}
