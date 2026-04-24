import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { ModeToggle } from './ModeToggle'
import { PersonaBadge } from './PersonaBadge'
import { WelcomeGallery } from './WelcomeGallery'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, Square } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'

export function ChatContainer({ onSend, onEndSession, isSessionActive, onToggleBrainPanel, brainPanelOpen }) {
  const { messages, isStreaming, streamingContent, currentSessionId } =
    useChatStore()
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  if (!currentSessionId) {
    return <WelcomeGallery />
  }

  return (
    <div
      className="h-full w-full grid overflow-hidden"
      style={{ gridTemplateRows: 'auto 1fr auto' }}
    >
      {/* Header — row 1 (auto) */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background/80 backdrop-blur gap-2">
        <PersonaBadge />

        <ModeToggle />

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant={brainPanelOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleBrainPanel}
            className="gap-1.5 text-xs"
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Brain</span>
          </Button>
          {isSessionActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEndSession}
              className="gap-1.5 text-xs"
            >
              <Square className="w-3 h-3" />
              <span className="hidden sm:inline">End</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages — row 2 (1fr), native scrolling */}
      <div
        ref={scrollRef}
        className="overflow-y-auto overflow-x-hidden p-4 min-h-0"
      >
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
      </div>

      {/* Input — row 3 (auto), always pinned */}
      <ChatInput onSend={onSend} disabled={isStreaming || !isSessionActive} />
    </div>
  )
}
