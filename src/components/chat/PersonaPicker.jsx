import { motion, AnimatePresence } from 'framer-motion'
import { PERSONAS } from '@/lib/therapist-personas'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PersonaPicker({ open, onOpenChange, currentPersonaId, onSelect, title = 'Choose your therapist' }) {
  const handleSelect = (personaId) => {
    onSelect(personaId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Each specialist is trained in a distinct clinical framework. Pick the approach that fits what you need today.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6 pt-2">
          {PERSONAS.map((p, i) => {
            const isActive = p.id === currentPersonaId
            return (
              <motion.button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.025 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  'group relative text-left rounded-xl border p-4 transition-all overflow-hidden',
                  isActive
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                    : 'border-border hover:border-primary/40 bg-card'
                )}
              >
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl bg-gradient-to-br shadow-sm',
                      p.gradient
                    )}
                  >
                    <span>{p.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{p.name}</h3>
                      {p.featured && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1 italic">{p.tagline}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {p.specialties.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </motion.button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
