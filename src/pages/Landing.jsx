import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { CTA } from '@/components/landing/CTA'

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <CTA />
      <footer className="text-center py-8 text-xs text-muted-foreground">
        Sage is an AI wellness companion, not a replacement for professional therapy.
      </footer>
    </div>
  )
}
