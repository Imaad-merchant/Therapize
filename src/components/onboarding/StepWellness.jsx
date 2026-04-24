import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { SLEEP_QUALITY_OPTIONS } from '@/lib/constants'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

const stressEmojis = ['😌', '🙂', '😐', '😟', '😣', '😫', '🤯', '😱', '💀', '🆘']

export function StepWellness({ data, onChange }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Activity className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Your Wellness</h2>
        <p className="text-muted-foreground">
          Tell us what's on your mind and how you're feeling.
        </p>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        <div className="space-y-2">
          <Label htmlFor="brings">What brings you here?</Label>
          <Textarea
            id="brings"
            placeholder="What's been on your mind? What would you like help with?"
            rows={4}
            value={data.what_brings_you || ''}
            onChange={(e) => onChange({ what_brings_you: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Label>
            Stress level:{' '}
            <span className="text-2xl ml-1">
              {stressEmojis[(data.stress_level || 5) - 1]}
            </span>{' '}
            <span className="text-muted-foreground font-normal">
              ({data.stress_level || 5}/10)
            </span>
          </Label>
          <Slider
            value={[data.stress_level || 5]}
            onValueChange={([val]) => onChange({ stress_level: val })}
            min={1}
            max={10}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Very calm</span>
            <span>Extremely stressed</span>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Sleep quality</Label>
          <div className="flex gap-2">
            {SLEEP_QUALITY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange({ sleep_quality: opt })}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border',
                  data.sleep_quality === opt
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
