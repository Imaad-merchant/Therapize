import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ArrowUp, Sparkles, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OnboardingFlow() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [started, setStarted] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [canComplete, setCanComplete] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const navigate = useNavigate()
  const { getAccessToken } = useAuth()

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Show "I'm ready" button after 6+ user messages
  useEffect(() => {
    const userMessageCount = messages.filter((m) => m.role === 'user').length
    if (userMessageCount >= 6) {
      setCanComplete(true)
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [input])

  const streamMessage = async (message, conversationHistory) => {
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const token = await getAccessToken()
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
        }),
      })

      if (!response.ok) throw new Error('Failed to connect')

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
              setStreamingContent((prev) => prev + parsed.content)
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

      return fullContent
    } catch (error) {
      console.error('Onboarding stream error:', error)
      return "I'm sorry, I had trouble connecting. Could you try again?"
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }

  const startIntake = async () => {
    setStarted(true)
    const content = await streamMessage('__INTAKE_START__', [])
    setMessages([{ role: 'assistant', content }])
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMsg = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const content = await streamMessage(
      userMsg.content,
      updatedMessages.filter((m) => m.role !== 'system')
    )

    setMessages((prev) => [...prev, { role: 'assistant', content }])
  }

  const completeOnboarding = async () => {
    setCompleting(true)

    try {
      const token = await getAccessToken()
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_history: messages,
        }),
      })

      if (!response.ok) throw new Error('Failed to complete onboarding')

      navigate('/chat')
    } catch (error) {
      console.error('Complete error:', error)
      setCompleting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Welcome screen before conversation starts
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg text-center space-y-8"
        >
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome to Sage
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Before we begin working together, I'd like to get to know you.
              This is a conversation, not a form — take your time, share what
              feels right, and we'll build from there.
            </p>
            <p className="text-muted-foreground text-sm">
              Everything you share is private and encrypted. This conversation
              typically takes 10-20 minutes.
            </p>
          </div>

          <Button
            size="lg"
            onClick={startIntake}
            className="gap-2 text-base px-8 py-6"
          >
            <Sparkles className="w-5 h-5" />
            Begin Conversation
          </Button>
        </motion.div>
      </div>
    )
  }

  // Conversational intake
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Getting to Know You</h2>
              <p className="text-xs text-muted-foreground">
                {messages.filter((m) => m.role === 'user').length === 0
                  ? 'Your initial conversation with Sage'
                  : `${messages.filter((m) => m.role === 'user').length} exchanges`}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {canComplete && !isStreaming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  onClick={completeOnboarding}
                  disabled={completing}
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {completing ? 'Building your profile...' : "I'm Ready"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border rounded-bl-md'
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 bg-card border">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {streamingContent}
                  <span className="inline-block w-1.5 h-4 bg-primary/50 ml-0.5 animate-pulse" />
                </p>
              </div>
            </motion.div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {completing ? (
            <div className="text-center py-4 space-y-2">
              <div className="flex justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </div>
              <p className="text-sm text-muted-foreground">
                Sage is putting together your life context document...
              </p>
            </div>
          ) : (
            <div className="relative flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind..."
                rows={1}
                disabled={isStreaming}
                className="flex-1 resize-none rounded-xl border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 min-h-[44px] max-h-[150px]"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="rounded-xl h-[44px] w-[44px] shrink-0"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-3">
            Your responses are private and encrypted. Take as much time as you
            need.
          </p>
        </div>
      </div>
    </div>
  )
}
