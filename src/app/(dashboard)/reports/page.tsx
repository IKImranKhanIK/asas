import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  let query = supabase
    .from('reports')
    .select('*, guard:profiles(full_name), location:locations(name)')
    .order('created_at', { ascending: false })

  if (profile?.role === 'guard') {
    query = query.eq('guard_id', user!.id)
  }

  const { data: reports } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Link
          href="/reports/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Report
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {reports && reports.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Guard</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map((report: any) => (
                <tr key={report.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/reports/${report.id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600">
                      {report.title}
                    </Link>
                    {report.location?.name && (
                      <p className="text-xs text-gray-400">{report.location.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{report.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[report.severity]}`}>
                      {report.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.guard?.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{format(new Date(report.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-gray-400 text-sm">No reports yet.</div>
        )}
      </div>
    </div>
  )
}
