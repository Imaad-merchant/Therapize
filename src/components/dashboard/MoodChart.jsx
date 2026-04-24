import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays, isAfter } from 'date-fns'

const ranges = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
]

export function MoodChart({ sessions }) {
  const [range, setRange] = useState(30)

  const filteredSessions = sessions
    .filter((s) => s.mood_score)
    .filter((s) =>
      range
        ? isAfter(new Date(s.created_at), subDays(new Date(), range))
        : true
    )

  const data = filteredSessions.map((s) => ({
    date: format(new Date(s.created_at), 'MMM d'),
    mood: s.mood_score,
  }))

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Mood Over Time</h3>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <Button
              key={r.label}
              variant={range === r.days ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setRange(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="oklch(0.55 0.18 270)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="oklch(0.55 0.18 270)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 270)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="oklch(0.50 0.02 260)"
            />
            <YAxis
              domain={[1, 10]}
              tick={{ fontSize: 12 }}
              stroke="oklch(0.50 0.02 260)"
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid oklch(0.90 0.01 270)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Area
              type="monotone"
              dataKey="mood"
              stroke="oklch(0.55 0.18 270)"
              strokeWidth={2}
              fill="url(#moodGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
          Complete a few sessions to see your mood trends
        </div>
      )}
    </Card>
  )
}
