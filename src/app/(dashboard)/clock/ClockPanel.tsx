'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClockPanel({ guardId, isClockedIn }: { guardId: string; isClockedIn: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  async function handleClock() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    let lat: number | undefined
    let lng: number | undefined

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      )
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch {}

    const { error: err } = await supabase.from('clock_events').insert({
      guard_id: guardId,
      type: isClockedIn ? 'clock_out' : 'clock_in',
      latitude: lat,
      longitude: lng,
      notes: notes.trim() || null,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setNotes('')
      router.refresh()
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center max-w-sm mx-auto">
      {/* Status indicator */}
      <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-6 relative ${
        isClockedIn ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-gray-800 border-2 border-gray-700'
      }`}>
        {isClockedIn && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-green-500" />
        )}
        <svg className={`w-12 h-12 ${isClockedIn ? 'text-green-400' : 'text-gray-500'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <p className="text-xl font-bold text-white mb-1">
        {isClockedIn ? 'On Duty' : 'Off Duty'}
      </p>
      <p className="text-sm text-gray-500 mb-6">
        {isClockedIn ? 'Your shift is active. Clock out when done.' : 'Clock in to start your shift.'}
      </p>

      {error && (
        <div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Optional notes…"
        rows={2}
        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-100 rounded-xl text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-600"
      />

      <button
        onClick={handleClock}
        disabled={loading}
        className={`w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 text-sm ${
          isClockedIn
            ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20'
            : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-600/20'
        }`}
      >
        {loading ? 'Processing…' : isClockedIn ? 'Clock Out' : 'Clock In'}
      </button>
    </div>
  )
}
