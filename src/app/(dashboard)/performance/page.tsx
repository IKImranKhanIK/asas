import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { startOfWeek, endOfWeek, differenceInMinutes, format } from 'date-fns'
import Link from 'next/link'

export default async function PerformancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role)) redirect('/dashboard')

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  const [{ data: guards }, { data: clockEvents }, { data: locationChecks }, { data: reports }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, badge_number').eq('role', 'guard').eq('is_active', true).order('full_name'),
    supabase.from('clock_events').select('guard_id, type, timestamp').gte('timestamp', weekStart.toISOString()).lte('timestamp', weekEnd.toISOString()).order('timestamp'),
    supabase.from('location_checks').select('guard_id').gte('timestamp', weekStart.toISOString()).lte('timestamp', weekEnd.toISOString()),
    supabase.from('reports').select('guard_id').gte('created_at', weekStart.toISOString()).lte('created_at', weekEnd.toISOString()),
  ])

  const guardStats = (guards ?? []).map(guard => {
    const events = (clockEvents ?? []).filter(e => e.guard_id === guard.id)
    let totalMinutes = 0
    let lastClockIn: Date | null = null
    events.forEach(e => {
      if (e.type === 'clock_in') lastClockIn = new Date(e.timestamp)
      else if (e.type === 'clock_out' && lastClockIn) {
        totalMinutes += differenceInMinutes(new Date(e.timestamp), lastClockIn)
        lastClockIn = null
      }
    })
    return {
      ...guard,
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      totalMinutes,
      checkIns: (locationChecks ?? []).filter(c => c.guard_id === guard.id).length,
      reportCount: (reports ?? []).filter(r => r.guard_id === guard.id).length,
      daysWorked: new Set(events.filter(e => e.type === 'clock_in').map(e => new Date(e.timestamp).toDateString())).size,
    }
  })

  const totalHours = guardStats.reduce((a, g) => a + g.totalMinutes, 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-white">Guard Performance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Guards', value: guardStats.length, accent: 'text-white' },
          { label: 'Total Hours This Week', value: `${Math.floor(totalHours / 60)}h`, accent: 'text-blue-400' },
          { label: 'Location Check-ins', value: guardStats.reduce((a, g) => a + g.checkIns, 0), accent: 'text-green-400' },
          { label: 'Reports Filed', value: guardStats.reduce((a, g) => a + g.reportCount, 0), accent: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">{s.label}</p>
            <p className={`text-3xl font-bold ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Guard</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Hours</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Days</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Check-ins</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Reports</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {guardStats.map(guard => (
              <tr key={guard.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-5 py-3.5">
                  <Link href={`/guards/${guard.id}`} className="text-sm font-medium text-gray-100 hover:text-blue-400 transition-colors">
                    {guard.full_name}
                  </Link>
                  {guard.badge_number && <p className="text-xs text-gray-600">Badge {guard.badge_number}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-sm font-semibold ${guard.totalMinutes === 0 ? 'text-red-400' : 'text-gray-100'}`}>
                    {guard.totalMinutes === 0 ? 'None' : `${guard.hours}h ${guard.minutes}m`}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-400 hidden sm:table-cell">{guard.daysWorked} / 7</td>
                <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell">{guard.checkIns}</td>
                <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell">{guard.reportCount}</td>
              </tr>
            ))}
            {guardStats.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-16 text-center text-gray-600 text-sm">No active guards found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
