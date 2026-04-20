import { createClient } from '@/lib/supabase/server'
import { format, differenceInMinutes, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export default async function ShiftsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = ['admin', 'supervisor'].includes(profile?.role)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  let query = supabase
    .from('clock_events')
    .select('*, guard:profiles(full_name)')
    .gte('timestamp', weekStart.toISOString())
    .lte('timestamp', weekEnd.toISOString())
    .order('timestamp')

  if (!isAdmin) query = query.eq('guard_id', user!.id)

  const { data: events } = await query

  // Group events by guard then by day
  const byGuard: Record<string, { name: string; days: Record<string, { clockIn?: string; clockOut?: string; minutes: number }> }> = {}

  for (const event of events ?? []) {
    const gId = event.guard_id
    const day = format(new Date(event.timestamp), 'yyyy-MM-dd')
    if (!byGuard[gId]) byGuard[gId] = { name: (event.guard as any)?.full_name ?? 'Unknown', days: {} }
    if (!byGuard[gId].days[day]) byGuard[gId].days[day] = { minutes: 0 }

    if (event.type === 'clock_in') byGuard[gId].days[day].clockIn = event.timestamp
    if (event.type === 'clock_out') {
      byGuard[gId].days[day].clockOut = event.timestamp
      if (byGuard[gId].days[day].clockIn) {
        byGuard[gId].days[day].minutes = differenceInMinutes(new Date(event.timestamp), new Date(byGuard[gId].days[day].clockIn!))
      }
    }
  }

  function fmtMins(mins: number) {
    if (!mins) return '—'
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Shift Summary</h1>
      <p className="text-sm text-gray-500">Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}</p>

      {Object.entries(byGuard).map(([guardId, data]) => {
        const totalMins = Object.values(data.days).reduce((a, d) => a + d.minutes, 0)
        return (
          <div key={guardId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{data.name}</h2>
              <span className="text-sm font-medium text-blue-600">Total: {fmtMins(totalMins)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {days.map(day => (
                      <th key={day.toISOString()} className="text-center px-4 py-2 text-xs font-medium text-gray-500">
                        {format(day, 'EEE')}<br />
                        <span className="font-normal">{format(day, 'MMM d')}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {days.map(day => {
                      const key = format(day, 'yyyy-MM-dd')
                      const d = data.days[key]
                      return (
                        <td key={key} className="text-center px-4 py-3 border-b border-gray-50">
                          {d ? (
                            <div>
                              {d.clockIn && <p className="text-xs text-green-600">▲ {format(new Date(d.clockIn), 'h:mm a')}</p>}
                              {d.clockOut && <p className="text-xs text-red-500">▼ {format(new Date(d.clockOut), 'h:mm a')}</p>}
                              {d.minutes > 0 && <p className="text-xs font-semibold text-gray-700 mt-1">{fmtMins(d.minutes)}</p>}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {Object.keys(byGuard).length === 0 && (
        <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm border border-gray-100">
          No shift data for this week.
        </div>
      )}
    </div>
  )
}
