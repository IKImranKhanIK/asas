import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: guardsCount },
    { count: activeCount },
    { data: recentClocks },
    { data: recentReports },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guard'),
    supabase.from('clock_events').select('*', { count: 'exact', head: true })
      .eq('type', 'clock_in')
      .gte('timestamp', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('clock_events').select('*, guard:profiles(full_name, badge_number)').order('timestamp', { ascending: false }).limit(5),
    supabase.from('reports').select('*, guard:profiles(full_name)').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Total Guards', value: guardsCount ?? 0, color: 'bg-blue-500' },
    { label: 'Clocked In Today', value: activeCount ?? 0, color: 'bg-green-500' },
    { label: 'Reports This Week', value: recentReports?.length ?? 0, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${stat.color} rounded-lg mb-3`} />
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Clock Events</h2>
          {recentClocks && recentClocks.length > 0 ? (
            <div className="space-y-3">
              {recentClocks.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{event.guard?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-500">Badge: {event.guard?.badge_number ?? 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${event.type === 'clock_in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {event.type === 'clock_in' ? 'Clocked In' : 'Clocked Out'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(event.timestamp), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No recent clock events.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Reports</h2>
          {recentReports && recentReports.length > 0 ? (
            <div className="space-y-3">
              {recentReports.map((report: any) => (
                <div key={report.id} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{report.title}</p>
                    <p className="text-xs text-gray-500">{report.guard?.full_name ?? 'Unknown'}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      report.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {report.severity}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(report.created_at), 'MMM d')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No reports yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
