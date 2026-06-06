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
    .limit(30)

  const isAdmin = ['admin', 'supervisor'].includes(profile?.role)
  const activeAlerts = alerts?.filter(a => a.status === 'active') ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">SOS / Emergency</h1>
          <p className="text-sm text-gray-500 mt-0.5">Emergency alerts and lone worker safety</p>
        </div>
        {activeAlerts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-red-400 text-xs font-semibold">{activeAlerts.length} ACTIVE</span>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-sm text-gray-400 mb-4 text-center">Press the button below in an emergency. Your GPS location will be shared with supervisors.</p>
          <SOSButton guardId={user!.id} />
        </div>
      )}

      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Active Alerts</p>
          {activeAlerts.map((alert: any) => (
            <div key={alert.id} className="bg-red-500/5 border border-red-500/25 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <p className="font-bold text-red-400 text-sm">EMERGENCY</p>
                </div>
                <p className="font-semibold text-white">{alert.guard?.full_name}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                  <span>Badge: {alert.guard?.badge_number ?? 'N/A'}</span>
                  <span>Phone: {alert.guard?.phone ?? 'N/A'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{format(new Date(alert.created_at), 'MMM d, h:mm:ss a')}</p>
                {alert.latitude && (
                  <a href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-blue-400 text-xs hover:underline">
                    View on map →
                  </a>
                )}
              </div>
              {isAdmin && <ResolveButton alertId={alert.id} />}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-100">Alert History</h2>
        </div>
        {alerts && alerts.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Guard</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Resolved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {alerts.map((alert: any) => (
                <tr key={alert.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-100">{alert.guard?.full_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{format(new Date(alert.created_at), 'MMM d, h:mm a')}</td>
                  <td className="px-5 py-3">
                    <span className={`badge border ${alert.status === 'active'
                      ? 'bg-red-500/15 text-red-400 border-red-500/20'
                      : 'bg-green-500/15 text-green-400 border-green-500/20'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 hidden md:table-cell">{alert.resolver?.full_name ?? '—'}</td>
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
