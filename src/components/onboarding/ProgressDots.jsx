import { cn } from '@/lib/utils'

export function ProgressDots({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2.5 rounded-full transition-all duration-300',
            i === currentStep
              ? 'w-8 bg-primary'
              : i < currentStep
                ? 'w-2.5 bg-primary/60'
                : 'w-2.5 bg-muted-foreground/20'
          )}
        />
      ))}
    </div>
  )
}
