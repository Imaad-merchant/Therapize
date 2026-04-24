import { useChatStore } from '@/stores/chatStore'
import { useAuth } from './useAuth'
import { useSessions } from './useSessions'
import { useQueryClient } from '@tanstack/react-query'

export function useChat() {
  const {
    messages,
    isStreaming,
    streamingContent,
    currentSessionId,
    addMessage,
    setMessages,
    setStreaming,
    appendStreamChunk,
    clearStreamingContent,
    setCurrentSession,
    resetChat,
  } = useChatStore()

  const { getAccessToken, user } = useAuth()
  const { createSession, endSession: endSessionMutation } = useSessions()
  const queryClient = useQueryClient()

  const sendMessage = async (content) => {
    if (!currentSessionId || isStreaming) return

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    addMessage(userMessage)

    setStreaming(true)
    clearStreamingContent()

    try {
      const token = await getAccessToken()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          message: content,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'chunk') {
              fullContent += parsed.content
              appendStreamChunk(parsed.content)
            } else if (parsed.type === 'done') {
              fullContent = parsed.content
            } else if (parsed.type === 'error') {
              throw new Error(parsed.content)
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') {
              console.error('Stream parse error:', e)
            }
          }
        }
      }

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      }
      addMessage(assistantMessage)
    } catch (error) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          "I'm sorry, I encountered an error. Please try sending your message again.",
        created_at: new Date().toISOString(),
      })
      console.error('Chat error:', error)
    } finally {
      setStreaming(false)
      clearStreamingContent()
    }
  }

  const startNewSession = async () => {
    const session = await createSession.mutateAsync()
    setCurrentSession(session.id)
    setMessages([])

    // Send initial greeting
    setStreaming(true)
    clearStreamingContent()

    try {
      const token = await getAccessToken()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: session.id,
          message: '__GREETING__',
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'chunk') {
              fullContent += parsed.content
              appendStreamChunk(parsed.content)
            } else if (parsed.type === 'done') {
              fullContent = parsed.content
            }
          } catch {}
        }
      }

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Greeting error:', error)
    } finally {
      setStreaming(false)
      clearStreamingContent()
    }

    return session
  }

  const endCurrentSession = async () => {
    if (!currentSessionId) return

    try {
      const token = await getAccessToken()
      await fetch('/api/insights/session-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: currentSessionId }),
      })
    } catch (error) {
      console.error('Summary error:', error)
    }

    await endSessionMutation.mutateAsync(currentSessionId)
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
    resetChat()
  }

  const loadSession = async (sessionId, existingMessages) => {
    setCurrentSession(sessionId)
    setMessages(existingMessages)
  }

  return {
    messages,
    isStreaming,
    streamingContent,
    currentSessionId,
    sendMessage,
    startNewSession,
    endCurrentSession,
    loadSession,
    resetChat,
  }
}
