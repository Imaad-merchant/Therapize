import { useState } from 'react'
import { getPersona } from '@/lib/therapist-personas'
import { useChatStore } from '@/stores/chatStore'
import { PersonaPicker } from './PersonaPicker'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PersonaBadge() {
  const { personaId, setPersonaId } = useChatStore()
  const persona = getPersona(personaId)
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setPickerOpen(true)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
      >
        <div
          className={cn(
            'w-6 h-6 rounded-md flex items-center justify-center text-sm bg-gradient-to-br',
            persona.gradient
          )}
        >
          {persona.icon}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-[11px] font-semibold leading-tight">{persona.name}</div>
          <div className="text-[9px] text-muted-foreground leading-tight">{persona.title}</div>
        </div>
        <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      <PersonaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentPersonaId={personaId}
        onSelect={setPersonaId}
        title="Switch specialist"
      />
    </>
  )
}
