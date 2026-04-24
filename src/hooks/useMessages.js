import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useMessages(sessionId) {
  const {
    data: messages = [],
    isLoading,
  } = useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!sessionId,
  })

  return { messages, isLoading }
}
