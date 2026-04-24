import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useSessions() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: sessions = [],
    isLoading,
  } = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  const createSession = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .insert({ user_id: user.id, is_active: true })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', user?.id] })
    },
  })

  const endSession = useMutation({
    mutationFn: async (sessionId) => {
      const { data, error } = await supabase
        .from('sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', user?.id] })
    },
  })

  return { sessions, isLoading, createSession, endSession }
}
