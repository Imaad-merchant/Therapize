import { Label } from '@/components/ui/label'
import { RELATIONSHIP_OPTIONS, WORK_SITUATION_OPTIONS } from '@/lib/constants'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

function SelectChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium transition-all border',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
      )}
    >
      {label}
    </button>
  )
}

export function StepAboutYou({ data, onChange }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">About You</h2>
        <p className="text-muted-foreground">
          Help us understand your current life situation.
        </p>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        <div className="space-y-3">
          <Label>Relationship status</Label>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <SelectChip
                key={opt}
                label={opt}
                selected={data.relationship_status === opt}
                onClick={() => onChange({ relationship_status: opt })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Work situation</Label>
          <div className="flex flex-wrap gap-2">
            {WORK_SITUATION_OPTIONS.map((opt) => (
              <SelectChip
                key={opt}
                label={opt}
                selected={data.work_situation === opt}
                onClick={() => onChange({ work_situation: opt })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
