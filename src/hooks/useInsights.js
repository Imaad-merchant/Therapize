import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useInsights() {
  const { user } = useAuth()

  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  const { data: sessionStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['session-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, created_at, ended_at, mood_score, themes, summary')
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  const { data: loginHistory = [], isLoading: loginLoading } = useQuery({
    queryKey: ['login-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  return {
    insights,
    sessionStats,
    loginHistory,
    isLoading: insightsLoading || statsLoading || loginLoading,
  }
}
