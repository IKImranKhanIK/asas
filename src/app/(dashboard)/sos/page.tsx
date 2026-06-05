import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import SOSButton from './SOSButton'
import ResolveButton from './ResolveButton'

export default async function SOSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const { data: alerts } = await supabase
    .from('sos_alerts')
    .select('*, guard:profiles!sos_alerts_guard_id_fkey(full_name, badge_number, phone), resolver:profiles!sos_alerts_resolved_by_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const isAdmin = ['admin', 'supervisor'].includes(profile?.role)
  const activeAlerts = alerts?.filter(a => a.status === 'active') ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-white">SOS / Emergency</h1>
        <p className="text-sm text-gray-500 mt-0.5">Emergency alerts and lone worker protection</p>
      </div>

      {/* Guard SOS button */}
      {!isAdmin && <SOSButton guardId={user!.id} />}

      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <h2 className="font-bold text-red-400 text-lg">
              {activeAlerts.length} ACTIVE ALERT{activeAlerts.length > 1 ? 'S' : ''} — RESPOND NOW
            </h2>
          </div>
          <div className="space-y-3">
            {activeAlerts.map((alert: any) => (
              <div key={alert.id}
                className="bg-gray-900 border border-red-500/30 rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-white">{alert.guard?.full_name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Badge #{alert.guard?.badge_number ?? 'N/A'} · {alert.guard?.phone ?? 'No phone'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(alert.created_at), 'MMM d, h:mm:ss a')}
                  </p>
                  {alert.latitude && (
                    <a href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2">
                      📍 View on Google Maps →
                    </a>
                  )}
                </div>
                {isAdmin && <ResolveButton alertId={alert.id} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert history */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-100">Alert History</h2>
        </div>
        {alerts && alerts.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Guard</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Resolved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {alerts.map((alert: any) => (
                <tr key={alert.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-100">{alert.guard?.full_name}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{format(new Date(alert.created_at), 'MMM d, h:mm a')}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge border ${alert.status === 'active'
                      ? 'bg-red-500/15 text-red-400 border-red-500/20'
                      : 'bg-green-500/15 text-green-400 border-green-500/20'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                    {alert.resolver?.full_name ?? <span className="text-gray-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-gray-600 text-sm">No SOS alerts recorded.</div>
        )}
      </div>
    </div>
  )
}
