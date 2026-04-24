import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart } from 'lucide-react'

export function StepWelcome({ data, onChange }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Welcome to Sage</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Let's get to know you a little better so we can personalize your experience. This only takes a few minutes.
        </p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <div className="space-y-2">
          <Label htmlFor="name">What should we call you?</Label>
          <Input
            id="name"
            placeholder="Your first name"
            value={data.display_name || ''}
            onChange={(e) => onChange({ display_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">How old are you?</Label>
          <Input
            id="age"
            type="number"
            placeholder="Age"
            min={13}
            max={120}
            value={data.age || ''}
            onChange={(e) => onChange({ age: parseInt(e.target.value) || '' })}
          />
        </div>
      </div>
    </div>
  )
}
