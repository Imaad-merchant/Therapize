import { cn } from '@/lib/utils'
import { Brain, User } from 'lucide-react'

export function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn('flex gap-3 max-w-[85%]', isUser ? 'ml-auto' : 'mr-auto')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
          <Brain className="w-4 h-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          'px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
            : 'bg-card border border-border rounded-2xl rounded-bl-sm'
        )}
      >
        {message.content}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/60 animate-pulse rounded-sm" />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  )
}
