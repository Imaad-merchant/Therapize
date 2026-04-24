import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto text-center bg-primary/5 rounded-2xl p-10 border border-primary/10">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">
          Begin Your Wellness Journey
        </h2>
        <p className="text-muted-foreground mb-6">
          Start with a quick questionnaire so Sage can understand you, then dive
          into your first conversation. It only takes a few minutes.
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link to="/auth">
            <Sparkles className="w-4 h-4" />
            Get Started for Free
          </Link>
        </Button>
      </div>
    </section>
  )
}
