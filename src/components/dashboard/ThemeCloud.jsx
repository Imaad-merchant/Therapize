import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ThemeCloud({ sessions }) {
  const themeCounts = {}
  sessions.forEach((s) => {
    ;(s.themes || []).forEach((theme) => {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1
    })
  })

  const sortedThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  const maxCount = sortedThemes[0]?.[1] || 1

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Key Themes</h3>

      {sortedThemes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sortedThemes.map(([theme, count]) => {
            const ratio = count / maxCount
            const size = ratio > 0.7 ? 'text-base' : ratio > 0.4 ? 'text-sm' : 'text-xs'
            return (
              <Badge
                key={theme}
                variant="secondary"
                className={`${size} px-3 py-1`}
              >
                {theme}
                <span className="ml-1 text-muted-foreground">({count})</span>
              </Badge>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Themes will appear after you complete sessions
        </p>
      )}
    </Card>
  )
}
