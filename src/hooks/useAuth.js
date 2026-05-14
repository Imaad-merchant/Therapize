import { useEffect } from 'react'
import { supabase, friendlyAuthError } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { user, session, loading, setUser, setSession, setLoading, reset } =
    useAuthStore()

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[useAuth] getSession failed:', err)
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading])

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return data
    } catch (err) {
      throw new Error(friendlyAuthError(err))
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    } catch (err) {
      throw new Error(friendlyAuthError(err))
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/chat` },
      })
      if (error) throw error
      return data
    } catch (err) {
      throw new Error(friendlyAuthError(err))
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    reset()
  }

  const getAccessToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    getAccessToken,
  }
}
