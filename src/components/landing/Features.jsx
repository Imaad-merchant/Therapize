import { Card } from '@/components/ui/card'
import { MessageCircle, Brain, LineChart, Shield, Clock, Heart } from 'lucide-react'

const features = [
  {
    icon: MessageCircle,
    title: 'Personalized Conversations',
    description:
      'Sage learns about your background, goals, and challenges to provide deeply personalized guidance.',
  },
  {
    icon: Brain,
    title: 'Evidence-Based Approaches',
    description:
      'Drawing from CBT, DBT, ACT, mindfulness, stoicism, and more to find what works for you.',
  },
  {
    icon: LineChart,
    title: 'Track Your Growth',
    description:
      'Visualize your mood trends, identify patterns, and celebrate progress over time.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description:
      'Your conversations are encrypted and private. Your data belongs to you.',
  },
  {
    icon: Clock,
    title: 'Always Available',
    description:
      'No scheduling, no waiting rooms. Get support whenever you need it, day or night.',
  },
  {
    icon: Heart,
    title: 'Compassionate Guidance',
    description:
      'Sage responds with genuine warmth, helping you navigate even the toughest moments.',
  },
]

export function Features() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">
          How Sage Supports You
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
