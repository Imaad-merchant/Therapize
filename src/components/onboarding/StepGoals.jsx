import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GOALS } from '@/lib/constants'
import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StepGoals({ data, onChange }) {
  const toggleGoal = (goal) => {
    const current = data.goals || []
    const updated = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal]
    onChange({ goals: updated })
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Your Goals</h2>
        <p className="text-muted-foreground">
          What would you like to work on? Select all that apply.
        </p>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        <div className="flex flex-wrap gap-2 justify-center">
          {GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                (data.goals || []).includes(goal)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
              )}
            >
              {goal}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalGoals">
            Anything else you'd like to share? (optional)
          </Label>
          <Textarea
            id="additionalGoals"
            placeholder="Any other goals or things you'd like us to know..."
            rows={3}
            value={data.additional_goals || ''}
            onChange={(e) => onChange({ additional_goals: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
