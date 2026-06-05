'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputClass = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-sm transition-colors"
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"

export default function InviteForm() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', full_name: '', role: 'guard', badge_number: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/guards/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to create guard.')
      setLoading(false)
    } else {
      setSuccess(`Account created for ${form.full_name}. They can now log in with the password you set.`)
      setForm({ email: '', full_name: '', role: 'guard', badge_number: '', phone: '', password: '' })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 max-w-lg">
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">{success}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-full">
          <label className={labelClass}>Full Name *</label>
          <input type="text" required value={form.full_name} onChange={e => set('full_name', e.target.value)}
            className={inputClass} placeholder="John Smith" />
        </div>
        <div className="col-span-full">
          <label className={labelClass}>Email *</label>
          <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
            className={inputClass} placeholder="guard@company.com" />
        </div>
        <div className="col-span-full">
          <label className={labelClass}>Temporary Password *</label>
          <input type="password" required value={form.password} onChange={e => set('password', e.target.value)}
            className={inputClass} placeholder="Share this with the guard securely" />
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <select value={form.role} onChange={e => set('role', e.target.value)}
            className={inputClass}>
            <option value="guard">Guard</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Badge Number</label>
          <input type="text" value={form.badge_number} onChange={e => set('badge_number', e.target.value)}
            className={inputClass} placeholder="e.g. G-1042" />
        </div>
        <div className="col-span-full">
          <label className={labelClass}>Phone</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
            className={inputClass} placeholder="+44 7700 000000" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors text-sm">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-lg shadow-blue-600/20">
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </div>
    </form>
  )
}
