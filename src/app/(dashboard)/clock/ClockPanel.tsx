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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${isClockedIn ? 'bg-green-100' : 'bg-gray-100'}`}>
        <svg className={`w-10 h-10 ${isClockedIn ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <p className="text-lg font-semibold text-gray-800 mb-1">
        {isClockedIn ? 'Currently Clocked In' : 'Currently Clocked Out'}
      </p>
      <p className="text-sm text-gray-500 mb-5">
        {isClockedIn ? 'Tap below to clock out of your shift.' : 'Tap below to start your shift.'}
      </p>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Optional notes..."
        rows={2}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      <button
        onClick={handleClock}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-60 ${
          isClockedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {loading ? 'Processing...' : isClockedIn ? 'Clock Out' : 'Clock In'}
      </button>
    </div>
  )
}
