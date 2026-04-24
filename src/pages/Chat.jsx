import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useChat } from '@/hooks/useChat'
import { useSessions } from '@/hooks/useSessions'
import { useMessages } from '@/hooks/useMessages'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { SessionList } from '@/components/chat/SessionList'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'

export default function Chat() {
  const { sessionId } = useParams()
  const {
    sendMessage,
    startNewSession,
    endCurrentSession,
    loadSession,
    currentSessionId,
  } = useChat()
  const { sessions, isLoading: sessionsLoading } = useSessions()
  const { messages: storedMessages } = useMessages(sessionId)
  const [sessionListOpen, setSessionListOpen] = useState(false)

  // Load session from URL param
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId && storedMessages.length > 0) {
      loadSession(sessionId, storedMessages)
    }
  }, [sessionId, storedMessages])

  const handleSelectSession = (session) => {
    setSessionListOpen(false)
    loadSession(session.id, [])
  }

  const handleNewSession = async () => {
    setSessionListOpen(false)
    await startNewSession()
  }

  const activeSession = sessions.find((s) => s.id === currentSessionId)
  const isActive = activeSession?.is_active !== false

  return (
    <div className="h-full flex">
      {/* Desktop session list */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          loading={sessionsLoading}
        />
      </div>

      {/* Mobile session list */}
      <Sheet open={sessionListOpen} onOpenChange={setSessionListOpen}>
        <div className="lg:hidden absolute top-4 right-4 z-40">
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur">
              <PanelLeftOpen className="w-5 h-5" />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="p-0 w-72">
          <SessionList
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            loading={sessionsLoading}
          />
        </SheetContent>
      </Sheet>

      {/* Chat area */}
      <div className="flex-1">
        <ChatContainer
          onSend={sendMessage}
          onEndSession={endCurrentSession}
          isSessionActive={isActive}
        />
      </div>
    </div>
  )
}
