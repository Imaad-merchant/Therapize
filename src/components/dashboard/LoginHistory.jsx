import { Card } from '@/components/ui/card'
import { format } from 'date-fns'

export function LoginHistory({ history }) {
  if (!history || history.length === 0) {
    return null
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Recent Logins</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium text-muted-foreground">Date</th>
              <th className="pb-2 font-medium text-muted-foreground">IP Address</th>
              <th className="pb-2 font-medium text-muted-foreground">Device</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2.5">
                  {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {entry.ip_address
                    ? entry.ip_address.replace(/\.\d+$/, '.***')
                    : '--'}
                </td>
                <td className="py-2.5 text-muted-foreground truncate max-w-[200px]">
                  {entry.user_agent
                    ? entry.user_agent.split('(')[0].trim()
                    : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
