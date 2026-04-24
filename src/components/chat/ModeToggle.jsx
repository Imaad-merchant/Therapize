import { motion } from 'framer-motion'
import { useChatStore } from '@/stores/chatStore'
import { Ear, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ModeToggle() {
  const { chatMode, setChatMode } = useChatStore()

  return (
    <div className="relative flex items-center bg-muted rounded-lg p-0.5 h-8">
      <motion.div
        className="absolute h-7 rounded-md bg-background shadow-sm"
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          width: 'calc(50% - 2px)',
          left: chatMode === 'listening' ? 2 : 'calc(50%)',
        }}
      />
      <button
        onClick={() => setChatMode('listening')}
        className={cn(
          'relative z-10 flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors flex-1 justify-center',
          chatMode === 'listening' ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <Ear className="w-3 h-3" />
        <span className="hidden sm:inline">Listening</span>
      </button>
      <button
        onClick={() => setChatMode('solution')}
        className={cn(
          'relative z-10 flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors flex-1 justify-center',
          chatMode === 'solution' ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <Lightbulb className="w-3 h-3" />
        <span className="hidden sm:inline">Solutions</span>
      </button>
    </div>
  )
}
