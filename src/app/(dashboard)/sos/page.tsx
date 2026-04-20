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
    .limit(20)

  const isAdmin = ['admin', 'supervisor'].includes(profile?.role)
  const activeAlerts = alerts?.filter(a => a.status === 'active') ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">SOS / Emergency</h1>

      {!isAdmin && (
        <SOSButton guardId={user!.id} />
      )}

      {activeAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h2 className="font-bold text-red-700 text-lg mb-3">🚨 Active Alerts ({activeAlerts.length})</h2>
          <div className="space-y-3">
            {activeAlerts.map((alert: any) => (
              <div key={alert.id} className="bg-white rounded-lg p-4 border border-red-200 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{alert.guard?.full_name}</p>
                  <p className="text-sm text-gray-500">Badge: {alert.guard?.badge_number ?? 'N/A'} · Phone: {alert.guard?.phone ?? 'N/A'}</p>
                  <p className="text-sm text-gray-500 mt-1">{format(new Date(alert.created_at), 'MMM d, h:mm:ss a')}</p>
                  {alert.latitude && (
                    <a
                      href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      📍 View on Google Maps
                    </a>
                  )}
                </div>
                {isAdmin && <ResolveButton alertId={alert.id} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Alert History</h2>
        </div>
        {alerts && alerts.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Guard</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Resolved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alerts.map((alert: any) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{alert.guard?.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(alert.created_at), 'MMM d, h:mm a')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${alert.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{alert.resolver?.full_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-gray-400 text-sm">No SOS alerts recorded.</div>
        )}
      </div>
    </div>
  )
}
