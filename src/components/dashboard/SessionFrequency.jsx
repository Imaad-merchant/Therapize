import { Card } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, startOfWeek, eachWeekOfInterval, subWeeks } from 'date-fns'

export function SessionFrequency({ sessions }) {
  const now = new Date()
  const weeks = eachWeekOfInterval({
    start: subWeeks(now, 11),
    end: now,
  })

  const data = weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const count = sessions.filter((s) => {
      const d = new Date(s.created_at)
      return d >= weekStart && d < weekEnd
    }).length
    return {
      week: format(weekStart, 'MMM d'),
      sessions: count,
    }
  })

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Session Frequency</h3>

      {sessions.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 270)" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11 }}
              stroke="oklch(0.50 0.02 260)"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              stroke="oklch(0.50 0.02 260)"
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid oklch(0.90 0.01 270)',
              }}
            />
            <Bar
              dataKey="sessions"
              fill="oklch(0.55 0.18 270)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          No session data yet
        </div>
      )}
    </Card>
  )
}
