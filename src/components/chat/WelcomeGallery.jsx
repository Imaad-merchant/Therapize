import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PERSONAS } from '@/lib/therapist-personas'
import { useChat } from '@/hooks/useChat'
import { useChatStore } from '@/stores/chatStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WelcomeGallery() {
  const navigate = useNavigate()
  const { startNewSession } = useChat()
  const { setPersonaId } = useChatStore()
  const [startingId, setStartingId] = useState(null)

  const handleStart = async (personaId) => {
    if (startingId) return
    setStartingId(personaId)
    setPersonaId(personaId)
    await new Promise((r) => setTimeout(r, 50))
    try {
      const session = await startNewSession()
      if (session?.id) {
        navigate(`/chat/${session.id}`)
      }
    } finally {
      setStartingId(null)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Who do you need today?
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            Every therapist is trained in a distinct clinical framework. Pick the approach that fits where you are right now.
          </p>
        </motion.div>

        {/* Persona grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSONAS.map((p, i) => {
            const isStarting = startingId === p.id
            return (
              <motion.button
                key={p.id}
                onClick={() => handleStart(p.id)}
                disabled={!!startingId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                whileHover={{ y: startingId ? 0 : -2 }}
                whileTap={{ scale: startingId ? 1 : 0.98 }}
                className={cn(
                  'group relative text-left rounded-2xl border p-5 bg-card transition-all overflow-hidden',
                  p.featured
                    ? 'border-primary/40 ring-1 ring-primary/10'
                    : 'border-border hover:border-primary/40',
                  startingId && !isStarting && 'opacity-40'
                )}
              >
                {/* Gradient accent bar */}
                <div
                  className={cn(
                    'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
                    p.gradient
                  )}
                />

                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br shadow-sm flex-shrink-0',
                      p.gradient
                    )}
                  >
                    <span>{p.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{p.name}</h3>
                      {p.featured && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{p.title}</p>
                  </div>
                  {isStarting && (
                    <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground italic mb-3">{p.tagline}</p>

                <div className="flex flex-wrap gap-1">
                  {p.specialties.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}
