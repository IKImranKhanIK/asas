'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Location { id: string; name: string }

const inputClass = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-sm transition-colors"
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"

const severityColors: Record<string, string> = {
  low:      'border-gray-700 text-gray-400',
  medium:   'border-amber-500/40 text-amber-400',
  high:     'border-orange-500/40 text-orange-400',
  critical: 'border-red-500/40 text-red-400',
}

export default function NewReportForm({ locations }: { locations: Location[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', body: '', type: 'patrol', severity: 'low', location_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase.from('reports').insert({
      guard_id: user!.id,
      title: form.title,
      body: form.body,
      type: form.type,
      severity: form.severity,
      location_id: form.location_id || null,
    })

    if (err) { setError(err.message); setLoading(false); return }

    router.push('/reports')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 max-w-2xl">
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      <div>
        <label className={labelClass}>Title *</label>
        <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
          className={inputClass} placeholder="Brief summary of the report" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className={inputClass}>
            <option value="patrol">Patrol</option>
            <option value="incident">Incident</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Severity</label>
          <select value={form.severity} onChange={e => set('severity', e.target.value)}
            className={`${inputClass} border ${severityColors[form.severity]}`}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {locations.length > 0 && (
        <div>
          <label className={labelClass}>Location (optional)</label>
          <select value={form.location_id} onChange={e => set('location_id', e.target.value)} className={inputClass}>
            <option value="">— Select location —</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass}>Details *</label>
        <textarea required value={form.body} onChange={e => set('body', e.target.value)}
          rows={7} className={`${inputClass} resize-none`}
          placeholder="Describe what happened in detail, including time, location, and any people involved…" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors text-sm">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-lg shadow-blue-600/20">
          {loading ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </form>
  )
}
