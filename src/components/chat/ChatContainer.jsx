import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, Square } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'

export function ChatContainer({ onSend, onEndSession, isSessionActive }) {
  const { messages, isStreaming, streamingContent, currentSessionId } =
    useChatStore()
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    }
  }, [messages, streamingContent])

  if (!currentSessionId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Welcome to Sage</h2>
          <p className="text-muted-foreground">
            Start a new session to begin your conversation. Sage is here to
            listen, guide, and support you on your wellness journey.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Session in progress
          </span>
        </div>
        {isSessionActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEndSession}
            className="gap-1.5 text-xs"
          >
            <Square className="w-3 h-3" />
            End Session
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isStreaming && streamingContent && (
            <MessageBubble
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
              }}
              isStreaming
            />
          )}

          {isStreaming && !streamingContent && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isStreaming || !isSessionActive} />
    </div>
  )
}
