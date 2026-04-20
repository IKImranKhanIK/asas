'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewLocationForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', address: '', geofence_radius: '' })
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

    const { error: err } = await supabase.from('locations').insert({
      name: form.name,
      description: form.description || null,
      address: form.address || null,
      geofence_radius: form.geofence_radius ? parseInt(form.geofence_radius) : null,
      created_by: userId,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/locations')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
        <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="e.g. Main Entrance, Parking Lot B" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Street address" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          placeholder="Optional notes about this location..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Geofence Radius <span className="text-gray-400 font-normal">(meters, optional)</span></label>
        <input type="number" min="50" max="5000" value={form.geofence_radius} onChange={e => set('geofence_radius', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="e.g. 200 — alert if guard leaves this radius" />
      </div>

      <p className="text-xs text-gray-400">A QR code will be automatically generated for this location.</p>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm">
          {loading ? 'Saving...' : 'Add Location'}
        </button>
      </div>
    </form>
  )
}
