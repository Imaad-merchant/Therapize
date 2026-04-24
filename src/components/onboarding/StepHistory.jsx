import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { COPING_MECHANISMS, EMOTIONAL_TRIGGERS } from '@/lib/constants'
import { History } from 'lucide-react'
import { cn } from '@/lib/utils'

function MultiSelectChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-sm transition-all border',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
      )}
    >
      {label}
    </button>
  )
}

export function StepHistory({ data, onChange }) {
  const toggleItem = (key, item) => {
    const current = data[key] || []
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item]
    onChange({ [key]: updated })
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <History className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Your History</h2>
        <p className="text-muted-foreground">
          Understanding your background helps us support you better.
        </p>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        <div className="space-y-3">
          <Label>Have you done therapy before?</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange({ past_therapy: true })}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border',
                data.past_therapy === true
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              )}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({ past_therapy: false, past_therapy_details: '' })
              }
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border',
                data.past_therapy === false
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              )}
            >
              No
            </button>
          </div>
          {data.past_therapy && (
            <Textarea
              placeholder="Tell us briefly about your experience (optional)"
              rows={2}
              value={data.past_therapy_details || ''}
              onChange={(e) =>
                onChange({ past_therapy_details: e.target.value })
              }
            />
          )}
        </div>

        <div className="space-y-3">
          <Label>What are your current coping mechanisms?</Label>
          <div className="flex flex-wrap gap-2">
            {COPING_MECHANISMS.map((item) => (
              <MultiSelectChip
                key={item}
                label={item}
                selected={(data.coping_mechanisms || []).includes(item)}
                onClick={() => toggleItem('coping_mechanisms', item)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>What tends to trigger strong emotions for you?</Label>
          <div className="flex flex-wrap gap-2">
            {EMOTIONAL_TRIGGERS.map((item) => (
              <MultiSelectChip
                key={item}
                label={item}
                selected={(data.emotional_triggers || []).includes(item)}
                onClick={() => toggleItem('emotional_triggers', item)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
