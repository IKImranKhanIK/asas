'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Location { id: string; name: string }

export default function NewReportForm({ locations }: { locations: Location[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', body: '', type: 'patrol', severity: 'low', location_id: '' })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: report, error: err } = await supabase.from('reports').insert({
      guard_id: user!.id,
      title: form.title,
      body: form.body,
      type: form.type,
      severity: form.severity,
      location_id: form.location_id || null,
    }).select('id').single()

    if (err) { setError(err.message); setLoading(false); return }

    // Upload attachments
    for (const file of files) {
      const path = `${report.id}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('report-attachments').upload(path, file)
      if (!upErr) {
        await supabase.from('report_attachments').insert({
          report_id: report.id,
          file_path: path,
          file_name: file.name,
          file_type: file.type,
          uploaded_by: user!.id,
        })
      }
    }

    router.push('/reports')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Brief description of the report"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="patrol">Patrol</option>
            <option value="incident">Incident</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <select value={form.severity} onChange={e => set('severity', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {locations.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
          <select value={form.location_id} onChange={e => set('location_id', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">— Select location —</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Details *</label>
        <textarea
          required
          value={form.body}
          onChange={e => set('body', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          placeholder="Describe what happened in detail..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attachments <span className="text-gray-400 font-normal">(photos, videos)</span></label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          {files.length > 0 ? (
            <ul className="text-sm text-gray-600 space-y-1">
              {files.map(f => <li key={f.name}>📎 {f.name}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Click to attach photos or videos</p>
          )}
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*" onChange={handleFiles} className="hidden" />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </form>
  )
}
