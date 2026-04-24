import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChat } from '@/hooks/useChat'
import { useSessions } from '@/hooks/useSessions'
import { useMessages } from '@/hooks/useMessages'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { SessionList } from '@/components/chat/SessionList'
import { BrainPanel } from '@/components/chat/BrainPanel'
import { PersonaPicker } from '@/components/chat/PersonaPicker'
import { useChatStore } from '@/stores/chatStore'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { PanelLeftOpen, Brain, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Chat() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const {
    sendMessage,
    startNewSession,
    endCurrentSession,
    loadSession,
    currentSessionId,
  } = useChat()
  const { sessions, isLoading: sessionsLoading } = useSessions()
  const { messages: storedMessages, isLoading: messagesLoading } = useMessages(sessionId)
  const [sessionListOpen, setSessionListOpen] = useState(false)
  const [brainPanelOpen, setBrainPanelOpen] = useState(true)
  const [mobileBrainOpen, setMobileBrainOpen] = useState(false)
  const [personaPickerOpen, setPersonaPickerOpen] = useState(false)
  const { personaId, setPersonaId } = useChatStore()

  // Load session whenever URL sessionId changes — even if messages are empty
  useEffect(() => {
    if (!sessionId) return
    if (messagesLoading) return
    if (sessionId !== currentSessionId) {
      loadSession(sessionId, storedMessages)
    }
  }, [sessionId, currentSessionId, messagesLoading, storedMessages])

  const handleSelectSession = (session) => {
    setSessionListOpen(false)
    navigate(`/chat/${session.id}`)
  }

  const handleNewSession = async () => {
    setSessionListOpen(false)
    // Open persona picker first — user selects then we create the session
    setPersonaPickerOpen(true)
  }

  const handlePersonaPickedAndStart = async (pickedId) => {
    setPersonaId(pickedId)
    setPersonaPickerOpen(false)
    // Small delay so Zustand state flushes before the API call
    setTimeout(async () => {
      const session = await startNewSession()
      if (session?.id) {
        navigate(`/chat/${session.id}`)
      }
    }, 50)
  }

  const handleToggleBrainPanel = () => {
    // On mobile, open sheet. On desktop, toggle sidebar.
    if (window.innerWidth < 1280) {
      setMobileBrainOpen(true)
    } else {
      setBrainPanelOpen((prev) => !prev)
    }
  }

  const activeSession = sessions.find((s) => s.id === currentSessionId)
  const isActive = activeSession?.is_active !== false

  return (
    <div className="h-full flex min-h-0 overflow-hidden">
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
      <div className="flex-1 min-w-0 min-h-0">
        <ChatContainer
          onSend={sendMessage}
          onEndSession={async () => {
            await endCurrentSession()
            navigate('/chat')
          }}
          isSessionActive={isActive}
          onToggleBrainPanel={handleToggleBrainPanel}
          brainPanelOpen={brainPanelOpen}
        />
      </div>

      {/* Desktop Brain Language panel */}
      <AnimatePresence>
        {brainPanelOpen && currentSessionId && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden xl:block flex-shrink-0 border-l border-border bg-background/50 overflow-hidden"
          >
            <div className="w-[340px] h-full">
              <BrainPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persona picker for new sessions */}
      <PersonaPicker
        open={personaPickerOpen}
        onOpenChange={setPersonaPickerOpen}
        currentPersonaId={personaId}
        onSelect={handlePersonaPickedAndStart}
        title="Choose your therapist for this session"
      />

      {/* Mobile Brain Language sheet */}
      <Sheet open={mobileBrainOpen} onOpenChange={setMobileBrainOpen}>
        <SheetContent side="right" className="p-0 w-[340px] sm:w-[380px]">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Brain Language</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => setMobileBrainOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <BrainPanel />
        </SheetContent>
      </Sheet>
    </div>
  )
}
