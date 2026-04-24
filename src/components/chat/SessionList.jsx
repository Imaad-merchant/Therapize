import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'

function MoodDot({ score }) {
  const color =
    score >= 7
      ? 'bg-green-400'
      : score >= 4
        ? 'bg-yellow-400'
        : 'bg-red-400'
  return <div className={cn('w-2 h-2 rounded-full', color)} />
}

export function SessionList({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  loading,
}) {
  return (
    <div className="h-full flex flex-col border-r border-border bg-sidebar">
      <div className="p-3">
        <Button
          onClick={onNewSession}
          disabled={loading}
          className="w-full gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors',
                session.id === currentSessionId
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
              )}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate font-medium">
                  {session.title || 'New Session'}
                </span>
                {session.mood_score && <MoodDot score={session.mood_score} />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 ml-5.5">
                {format(new Date(session.created_at), 'MMM d, h:mm a')}
              </p>
            </button>
          ))}

          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No sessions yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
