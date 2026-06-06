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

  let query = supabase.from('clock_events').select('*, guard:profiles(full_name)')
    .gte('timestamp', weekStart.toISOString())
    .lte('timestamp', weekEnd.toISOString())
    .order('timestamp')
  if (!isAdmin) query = query.eq('guard_id', user!.id)

  const { data: events } = await query

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
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-white">Shift Summary</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </p>
      </div>

      {Object.entries(byGuard).length > 0 ? Object.entries(byGuard).map(([guardId, data]) => {
        const totalMins = Object.values(data.days).reduce((a, d) => a + d.minutes, 0)
        return (
          <div key={guardId} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-gray-100">{data.name}</h2>
              <span className="text-sm font-semibold text-blue-400">Total: {fmtMins(totalMins)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {days.map(day => (
                      <th key={day.toISOString()} className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">
                        <span className="block text-gray-400">{format(day, 'EEE')}</span>
                        <span className="block text-gray-600 font-normal">{format(day, 'MMM d')}</span>
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
                        <td key={key} className="text-center px-4 py-3">
                          {d ? (
                            <div className="space-y-0.5">
                              {d.clockIn && <p className="text-xs text-green-400">▲ {format(new Date(d.clockIn), 'h:mm a')}</p>}
                              {d.clockOut && <p className="text-xs text-red-400">▼ {format(new Date(d.clockOut), 'h:mm a')}</p>}
                              {d.minutes > 0 && <p className="text-xs font-semibold text-gray-300 mt-1">{fmtMins(d.minutes)}</p>}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-700">—</span>
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
      }) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl py-16 text-center text-gray-600 text-sm">
          No shift data recorded this week.
        </div>
      )}
    </div>
  )
}
