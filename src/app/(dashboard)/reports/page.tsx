import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'

const severityStyle: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/20',
  medium:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
  low:      'bg-gray-700/50 text-gray-400 border-gray-700',
}

const typeStyle: Record<string, string> = {
  incident:    'bg-red-500/10 text-red-400',
  patrol:      'bg-blue-500/10 text-blue-400',
  maintenance: 'bg-amber-500/10 text-amber-400',
  other:       'bg-gray-700/50 text-gray-400',
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  let query = supabase
    .from('reports')
    .select('*, guard:profiles(full_name), location:locations(name)')
    .order('created_at', { ascending: false })

  if (profile?.role === 'guard') query = query.eq('guard_id', user!.id)

  const { data: reports } = await query

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">{reports?.length ?? 0} total</p>
        </div>
        <Link href="/reports/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
          + New Report
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {reports && reports.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Guard</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {reports.map((report: any) => (
                <tr key={report.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/reports/${report.id}`}
                      className="text-sm font-medium text-gray-100 hover:text-blue-400 transition-colors">
                      {report.title}
                    </Link>
                    {report.location?.name && (
                      <p className="text-xs text-gray-600 mt-0.5">{report.location.name}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={`badge ${typeStyle[report.type] ?? typeStyle.other}`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge border ${severityStyle[report.severity] ?? severityStyle.low}`}>
                      {report.severity}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400 hidden lg:table-cell">
                    {report.guard?.full_name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden sm:table-cell">
                    {format(new Date(report.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">No reports yet.</p>
            <Link href="/reports/new" className="mt-3 inline-block text-blue-400 text-sm hover:underline">
              File your first report →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
