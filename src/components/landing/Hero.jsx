import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Brain, ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Your AI Wellness
          <br />
          <span className="text-primary">Companion</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Sage is a personalized AI wellness coach that combines evidence-based
          therapeutic approaches with deep understanding of who you are. Available
          whenever you need support.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/auth">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
