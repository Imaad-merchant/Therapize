import { motion } from 'framer-motion'
import { useChatStore } from '@/stores/chatStore'
import { Ear, Lightbulb, Swords, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODES = [
  { id: 'listening', label: 'Listen', icon: Ear },
  { id: 'solution', label: 'Solve', icon: Lightbulb },
  { id: 'challenger', label: 'Challenge', icon: Swords },
  { id: 'all', label: 'All', icon: Sparkles },
]

export function ModeToggle() {
  const { chatMode, setChatMode } = useChatStore()
  const activeIndex = MODES.findIndex((m) => m.id === chatMode)
  const widthPct = 100 / MODES.length

  return (
    <div className="relative flex items-center bg-muted rounded-lg p-0.5 h-8">
      <motion.div
        className="absolute h-7 rounded-md bg-background shadow-sm"
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          width: `calc(${widthPct}% - 2px)`,
          left: `calc(${widthPct * activeIndex}% + 1px)`,
        }}
      />
      {MODES.map((m) => {
        const Icon = m.icon
        return (
          <button
            key={m.id}
            onClick={() => setChatMode(m.id)}
            className={cn(
              'relative z-10 flex items-center gap-1.5 px-2 h-7 rounded-md text-[11px] font-medium transition-colors flex-1 justify-center',
              chatMode === m.id ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
