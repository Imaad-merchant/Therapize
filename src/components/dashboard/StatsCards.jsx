import { Card } from '@/components/ui/card'
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
} from 'lucide-react'
import { startOfWeek, isWithinInterval, subDays } from 'date-fns'

export function StatsCards({ sessions }) {
  const totalSessions = sessions.length

  const moodScores = sessions
    .filter((s) => s.mood_score)
    .map((s) => s.mood_score)
  const latestMood = moodScores[moodScores.length - 1]
  const prevMood = moodScores[moodScores.length - 2]
  const moodTrend = latestMood && prevMood ? latestMood - prevMood : 0

  const now = new Date()
  const weekStart = startOfWeek(now)
  const sessionsThisWeek = sessions.filter((s) =>
    isWithinInterval(new Date(s.created_at), { start: weekStart, end: now })
  ).length

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayCounts = new Array(7).fill(0)
  sessions.forEach((s) => {
    dayCounts[new Date(s.created_at).getDay()]++
  })
  const mostActiveDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))]

  const stats = [
    {
      label: 'Total Sessions',
      value: totalSessions,
      icon: MessageCircle,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      label: 'Mood Trend',
      value: latestMood ? `${latestMood}/10` : '--',
      icon: moodTrend >= 0 ? TrendingUp : TrendingDown,
      color: moodTrend >= 0 ? 'text-chart-3' : 'text-destructive',
      bgColor: moodTrend >= 0 ? 'bg-chart-3/10' : 'bg-destructive/10',
      sub: moodTrend !== 0 ? `${moodTrend > 0 ? '+' : ''}${moodTrend} from last` : null,
    },
    {
      label: 'Most Active Day',
      value: totalSessions > 0 ? mostActiveDay : '--',
      icon: Calendar,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
    {
      label: 'This Week',
      value: sessionsThisWeek,
      icon: Activity,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              {stat.sub && (
                <p className={`text-xs mt-0.5 ${stat.color}`}>{stat.sub}</p>
              )}
            </div>
            <div
              className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}
            >
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
