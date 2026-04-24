import { Card } from '@/components/ui/card'
import { Brain, Repeat, TrendingUp, Eye } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const typeIcons = {
  personality: Brain,
  behavior: Repeat,
  growth: TrendingUp,
  pattern: Eye,
}

const typeColors = {
  personality: 'text-chart-1 bg-chart-1/10',
  behavior: 'text-chart-2 bg-chart-2/10',
  growth: 'text-chart-3 bg-chart-3/10',
  pattern: 'text-chart-4 bg-chart-4/10',
}

export function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Personality Insights</h3>
        <p className="text-muted-foreground text-sm">
          Complete more sessions for AI-generated personality insights and behavioral patterns.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Personality Insights</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((insight, i) => {
          const Icon = typeIcons[insight.type] || Brain
          const colors = typeColors[insight.type] || 'text-primary bg-primary/10'
          return (
            <div
              key={i}
              className="p-4 rounded-xl border bg-card/50 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg ${colors} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {insight.type}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
              <div className="flex items-center gap-2">
                <Progress
                  value={(insight.confidence || 0) * 100}
                  className="h-1.5"
                />
                <span className="text-[10px] text-muted-foreground">
                  {Math.round((insight.confidence || 0) * 100)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
