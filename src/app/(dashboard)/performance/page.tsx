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
    supabase.from('profiles').select('id, full_name, badge_number, is_active').eq('role', 'guard').eq('is_active', true).order('full_name'),
    supabase.from('clock_events').select('guard_id, type, timestamp').gte('timestamp', weekStart.toISOString()).lte('timestamp', weekEnd.toISOString()).order('timestamp'),
    supabase.from('location_checks').select('guard_id').gte('timestamp', weekStart.toISOString()).lte('timestamp', weekEnd.toISOString()),
    supabase.from('reports').select('guard_id').gte('created_at', weekStart.toISOString()).lte('created_at', weekEnd.toISOString()),
  ])

  // Calculate hours worked per guard
  const guardStats = (guards ?? []).map(guard => {
    const events = (clockEvents ?? []).filter(e => e.guard_id === guard.id)
    let totalMinutes = 0
    let lastClockIn: Date | null = null

    events.forEach(e => {
      if (e.type === 'clock_in') {
        lastClockIn = new Date(e.timestamp)
      } else if (e.type === 'clock_out' && lastClockIn) {
        totalMinutes += differenceInMinutes(new Date(e.timestamp), lastClockIn)
        lastClockIn = null
      }
    })

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const checkIns = (locationChecks ?? []).filter(c => c.guard_id === guard.id).length
    const reportCount = (reports ?? []).filter(r => r.guard_id === guard.id).length
    const clockedInDays = new Set(events.filter(e => e.type === 'clock_in').map(e => new Date(e.timestamp).toDateString())).size

    return { ...guard, hours, minutes, totalMinutes, checkIns, reportCount, clockedInDays }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guard Performance</h1>
        <p className="text-sm text-gray-500 mt-1">Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-gray-900">{guardStats.length}</p>
          <p className="text-sm text-gray-500 mt-1">Active Guards</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-gray-900">{guardStats.reduce((a, g) => a + g.checkIns, 0)}</p>
          <p className="text-sm text-gray-500 mt-1">Location Check-ins This Week</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-gray-900">{guardStats.reduce((a, g) => a + g.reportCount, 0)}</p>
          <p className="text-sm text-gray-500 mt-1">Reports Filed This Week</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Guard</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hours This Week</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Days Worked</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Location Check-ins</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reports</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {guardStats.map(guard => (
              <tr key={guard.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/guards/${guard.id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600">
                    {guard.full_name}
                  </Link>
                  {guard.badge_number && <p className="text-xs text-gray-400">Badge: {guard.badge_number}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-semibold ${guard.totalMinutes === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                    {guard.totalMinutes === 0 ? 'No hours' : `${guard.hours}h ${guard.minutes}m`}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{guard.clockedInDays} / 7</td>
                <td className="px-4 py-3 text-sm text-gray-600">{guard.checkIns}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{guard.reportCount}</td>
              </tr>
            ))}
            {guardStats.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No active guards found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
