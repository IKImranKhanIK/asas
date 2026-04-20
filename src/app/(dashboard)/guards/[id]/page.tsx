import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import EditGuardForm from './EditGuardForm'

export default async function GuardProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (!['admin', 'supervisor'].includes(currentProfile?.role)) redirect('/dashboard')

  const { data: guard } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!guard) notFound()

  const { data: recentClocks } = await supabase
    .from('clock_events')
    .select('*')
    .eq('guard_id', id)
    .order('timestamp', { ascending: false })
    .limit(10)

  const { data: recentReports } = await supabase
    .from('reports')
    .select('id, title, type, severity, created_at')
    .eq('guard_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/guards" className="text-sm text-gray-400 hover:text-gray-600">← Guards</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {guard.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{guard.full_name}</h1>
            <p className="text-sm text-gray-500">{guard.email}</p>
          </div>
          <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium ${guard.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {guard.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <EditGuardForm guard={guard} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Clock Events</h2>
        {recentClocks && recentClocks.length > 0 ? (
          <div className="space-y-2">
            {recentClocks.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${event.type === 'clock_in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {event.type === 'clock_in' ? '▲ Clock In' : '▼ Clock Out'}
                </span>
                <span className="text-sm text-gray-500">{format(new Date(event.timestamp), 'MMM d, h:mm a')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No clock events recorded.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Reports</h2>
        {recentReports && recentReports.length > 0 ? (
          <div className="space-y-2">
            {recentReports.map((report: any) => (
              <Link key={report.id} href={`/reports/${report.id}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
                <p className="text-sm font-medium text-gray-800">{report.title}</p>
                <span className="text-xs text-gray-400">{format(new Date(report.created_at), 'MMM d')}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No reports submitted.</p>
        )}
      </div>
    </div>
  )
}
