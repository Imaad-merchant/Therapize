import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'

export function useMemories() {
  const { user, getAccessToken } = useAuth()
  const queryClient = useQueryClient()

  const fetchAuth = async (url, opts = {}) => {
    const token = await getAccessToken()
    const res = await fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    })
    if (!res.ok) throw new Error('Request failed')
    return res.json()
  }

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories', user?.id],
    queryFn: () => fetchAuth('/api/memories'),
    enabled: !!user?.id,
  })

  const saveMemory = useMutation({
    mutationFn: ({ session_id, source_type, payload, note }) =>
      fetchAuth('/api/memories', {
        method: 'POST',
        body: JSON.stringify({ session_id, source_type, payload, note }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', user?.id] })
    },
  })

  const deleteMemory = useMutation({
    mutationFn: (id) =>
      fetchAuth(`/api/memories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', user?.id] })
    },
  })

  const updateMemory = useMutation({
    mutationFn: ({ id, note }) =>
      fetchAuth(`/api/memories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', user?.id] })
    },
  })

  return { memories, isLoading, saveMemory, deleteMemory, updateMemory }
}
