'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Guard { id: string; full_name: string; role: string }

export default function NewMessageForm({ senderId, guards }: { senderId: string; guards: Guard[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ subject: '', body: '', recipient_id: '', is_broadcast: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error: err } = await supabase.from('messages').insert({
      sender_id: senderId,
      recipient_id: form.is_broadcast ? null : form.recipient_id || null,
      is_broadcast: form.is_broadcast,
      subject: form.subject || null,
      body: form.body,
    })

    if (err) { setError(err.message); setLoading(false); return }

    router.push('/messages')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <input type="checkbox" id="broadcast" checked={form.is_broadcast}
          onChange={e => set('is_broadcast', e.target.checked)} className="w-4 h-4 accent-blue-600" />
        <label htmlFor="broadcast" className="text-sm font-medium text-yellow-800">
          Broadcast to all guards and supervisors
        </label>
      </div>

      {!form.is_broadcast && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient *</label>
          <select required={!form.is_broadcast} value={form.recipient_id} onChange={e => set('recipient_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">— Select recipient —</option>
            {guards.filter(g => g.id !== senderId).map(g => (
              <option key={g.id} value={g.id}>{g.full_name} ({g.role})</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input type="text" value={form.subject} onChange={e => set('subject', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Optional subject line" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
        <textarea required value={form.body} onChange={e => set('body', e.target.value)} rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          placeholder="Type your message..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm">
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  )
}
