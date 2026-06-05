import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

const severityBadge: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/20',
  high:     'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  medium:   'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  low:      'bg-gray-700/50 text-gray-400 border border-gray-700',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  const [
    { count: guardsCount },
    { count: clockedInCount },
    { count: activeSOSCount },
    { data: recentClocks },
    { data: recentReports },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guard').eq('is_active', true),
    supabase.from('clock_events').select('*', { count: 'exact', head: true })
      .eq('type', 'clock_in').gte('timestamp', todayStart.toISOString()),
    supabase.from('sos_alerts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('clock_events')
      .select('*, guard:profiles(full_name, badge_number)')
      .order('timestamp', { ascending: false }).limit(6),
    supabase.from('reports')
      .select('*, guard:profiles(full_name)')
      .order('created_at', { ascending: false }).limit(6),
  ])

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Operations Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live summary of guard activity</p>
      </div>

      {/* Active SOS banner */}
      {(activeSOSCount ?? 0) > 0 && (
        <Link href="/sos"
          className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 hover:bg-red-500/15 transition-colors">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <p className="font-semibold text-red-400">
            {activeSOSCount} ACTIVE SOS ALERT{(activeSOSCount ?? 0) > 1 ? 'S' : ''} — Click to respond
          </p>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Guards" value={guardsCount ?? 0} sub="registered" accent="text-white" />
        <StatCard label="Clocked In Today" value={clockedInCount ?? 0} sub="since midnight" accent="text-green-400" />
        <StatCard label="SOS Alerts" value={activeSOSCount ?? 0} sub="requires attention" accent={(activeSOSCount ?? 0) > 0 ? 'text-red-400' : 'text-gray-400'} />
        <StatCard label="Reports This Week" value={recentReports?.length ?? 0} sub="past 7 days" accent="text-blue-400" />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Clock events */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-100">Recent Clock Events</h2>
            <Link href="/clock" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {recentClocks && recentClocks.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {recentClocks.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${event.type === 'clock_in' ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-100">{event.guard?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-500">Badge #{event.guard?.badge_number ?? 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${event.type === 'clock_in' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-gray-700/50 text-gray-400 border border-gray-700'}`}>
                      {event.type === 'clock_in' ? 'In' : 'Out'}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">{format(new Date(event.timestamp), 'h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-gray-600 text-sm">No clock events yet.</div>
          )}
        </div>

        {/* Reports */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-100">Recent Reports</h2>
            <Link href="/reports" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {recentReports && recentReports.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {recentReports.map((report: any) => (
                <Link key={report.id} href={`/reports/${report.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/50 transition-colors">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-gray-100 truncate">{report.title}</p>
                    <p className="text-xs text-gray-500">{report.guard?.full_name ?? 'Unknown'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`badge ${severityBadge[report.severity] ?? severityBadge.low}`}>
                      {report.severity}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">{format(new Date(report.created_at), 'MMM d')}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-gray-600 text-sm">No reports yet.</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/reports/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
            + File Report
          </Link>
          <Link href="/guards/invite" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-xl border border-gray-700 transition-colors">
            + Add Guard
          </Link>
          <Link href="/locations/new" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-xl border border-gray-700 transition-colors">
            + New Location
          </Link>
        </div>
      </div>
    </div>
  )
}
