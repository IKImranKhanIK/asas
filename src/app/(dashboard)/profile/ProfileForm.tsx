'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Profile } from '@/types'

const inputClass = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-sm transition-colors"
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"

const roleLabel: Record<string, string> = { admin: 'Administrator', supervisor: 'Supervisor', guard: 'Security Guard' }
const roleDot: Record<string, string> = { admin: 'bg-purple-500', supervisor: 'bg-blue-500', guard: 'bg-green-500' }

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: profile.full_name, phone: profile.phone ?? '' })
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSaved(false)
    const supabase = createClient()
    const { error: profileErr } = await supabase.from('profiles').update({
      full_name: form.full_name, phone: form.phone || null,
    }).eq('id', profile.id)
    if (profileErr) { setError(profileErr.message); setLoading(false); return }
    if (password) {
      const { error: pwErr } = await supabase.auth.updateUser({ password })
      if (pwErr) { setError(pwErr.message); setLoading(false); return }
    }
    setSaved(true); router.refresh(); setLoading(false)
  }

  return (
    <div className="max-w-lg space-y-5">
      {/* Avatar card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-bold text-white text-lg leading-tight">{profile.full_name}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${roleDot[profile.role]}`} />
            <p className="text-xs text-gray-400">{roleLabel[profile.role]}</p>
            {profile.badge_number && (
              <span className="text-xs text-gray-600 ml-1">· Badge {profile.badge_number}</span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-100 mb-5">Edit Profile</h2>

        {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
        {saved && <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">Profile updated successfully.</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input type="text" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className={inputClass} placeholder="+44 7700 000000" />
          </div>
          <div>
            <label className={labelClass}>New Password <span className="text-gray-600 font-normal normal-case">(leave blank to keep current)</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className={inputClass} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-lg shadow-blue-600/20">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
