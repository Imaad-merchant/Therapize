import { useInsights } from '@/hooks/useInsights'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { MoodChart } from '@/components/dashboard/MoodChart'
import { SessionFrequency } from '@/components/dashboard/SessionFrequency'
import { ThemeCloud } from '@/components/dashboard/ThemeCloud'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { LoginHistory } from '@/components/dashboard/LoginHistory'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Dashboard() {
  const { insights, sessionStats, loginHistory, isLoading } = useInsights()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your wellness journey and growth over time
          </p>
        </div>

        <StatsCards sessions={sessionStats} />

        <div className="grid lg:grid-cols-2 gap-6">
          <MoodChart sessions={sessionStats} />
          <SessionFrequency sessions={sessionStats} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ThemeCloud sessions={sessionStats} />
          <InsightsPanel insights={insights} />
        </div>

        <LoginHistory history={loginHistory} />
      </div>
    </ScrollArea>
  )
}
