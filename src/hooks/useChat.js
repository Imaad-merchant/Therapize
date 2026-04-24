import { useChatStore } from '@/stores/chatStore'
import { useAuth } from './useAuth'
import { useSessions } from './useSessions'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useChat() {
  const {
    messages,
    isStreaming,
    streamingContent,
    currentSessionId,
    chatMode,
    brainInsights,
    isAnalyzing,
    addMessage,
    setMessages,
    setStreaming,
    appendStreamChunk,
    clearStreamingContent,
    setCurrentSession,
    resetChat,
    setBrainInsights,
    setAnalyzing,
    setChatMode,
  } = useChatStore()

  const { getAccessToken, user } = useAuth()
  const { createSession, endSession: endSessionMutation } = useSessions()
  const queryClient = useQueryClient()

  // Background insight analysis — fires after each assistant response
  const analyzeConversation = async () => {
    if (!currentSessionId) return
    setAnalyzing(true)

    try {
      const token = await getAccessToken()
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: currentSessionId }),
      })

      if (response.ok) {
        const insights = await response.json()
        setBrainInsights(insights)
      }
    } catch (error) {
      console.error('Analyze error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

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
          chat_mode: chatMode,
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

      // Fire insight analysis in background after each exchange
      analyzeConversation()
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
    setBrainInsights(null)

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
          chat_mode: chatMode,
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
    setBrainInsights(null)

    // Load persisted brain_insights and chat_mode from the session row
    try {
      const { data: sessionRow } = await supabase
        .from('sessions')
        .select('brain_insights, chat_mode')
        .eq('id', sessionId)
        .single()

      if (sessionRow?.brain_insights) {
        setBrainInsights(sessionRow.brain_insights)
      }
      if (sessionRow?.chat_mode) {
        setChatMode(sessionRow.chat_mode)
      }
    } catch (e) {
      console.error('Session load error:', e)
    }

    // Re-analyze if the session has messages but no stored insights yet
    if (existingMessages.length > 0) {
      setTimeout(() => {
        const store = useChatStore.getState()
        if (store.currentSessionId === sessionId && !store.brainInsights) {
          analyzeConversation()
        }
      }, 100)
    }
  }

  return {
    messages,
    isStreaming,
    streamingContent,
    currentSessionId,
    chatMode,
    brainInsights,
    isAnalyzing,
    sendMessage,
    startNewSession,
    endCurrentSession,
    loadSession,
    resetChat,
    analyzeConversation,
  }
}
