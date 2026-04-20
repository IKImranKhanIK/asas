import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const typeColors: Record<string, string> = {
  incident: 'bg-red-50 text-red-700',
  patrol: 'bg-blue-50 text-blue-700',
  maintenance: 'bg-yellow-50 text-yellow-700',
  other: 'bg-gray-50 text-gray-600',
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select('*, guard:profiles(full_name, badge_number, email), location:locations(name, address)')
    .eq('id', id)
    .single()

  if (!report) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/reports" className="text-sm text-gray-400 hover:text-gray-600">← Reports</Link>
        <a
          href={`/api/reports/${id}/pdf`}
          target="_blank"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
        >
          ↓ Export PDF
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
          <div className="flex gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[report.type]}`}>
              {report.type}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${severityColors[report.severity]}`}>
              {report.severity}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Submitted by</p>
            <p className="text-sm font-medium text-gray-800">{report.guard?.full_name}</p>
            <p className="text-xs text-gray-500">{report.guard?.email}</p>
            {report.guard?.badge_number && (
              <p className="text-xs text-gray-400">Badge: {report.guard.badge_number}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Date & Time</p>
            <p className="text-sm font-medium text-gray-800">{format(new Date(report.created_at), 'MMMM d, yyyy')}</p>
            <p className="text-xs text-gray-500">{format(new Date(report.created_at), 'h:mm a')}</p>
          </div>
          {report.location && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Location</p>
              <p className="text-sm font-medium text-gray-800">{report.location.name}</p>
              {report.location.address && <p className="text-xs text-gray-500">{report.location.address}</p>}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Details</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{report.body}</p>
        </div>
      </div>
    </div>
  )
}
