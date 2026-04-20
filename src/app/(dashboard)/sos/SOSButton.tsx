'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SOSButton({ guardId }: { guardId: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function triggerSOS() {
    setLoading(true)
    let lat: number | undefined
    let lng: number | undefined

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      )
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch {}

    const supabase = createClient()
    await supabase.from('sos_alerts').insert({
      guard_id: guardId,
      latitude: lat,
      longitude: lng,
    })

    await fetch('/api/sos/notify', { method: 'POST' })

    setSent(true)
    setConfirm(false)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🚨</div>
        <h2 className="text-xl font-bold text-red-700">SOS Alert Sent</h2>
        <p className="text-red-600 mt-2">Your supervisors have been notified with your location. Stay where you are.</p>
        <button onClick={() => setSent(false)} className="mt-4 text-sm text-red-500 hover:underline">Dismiss</button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <p className="text-gray-600 text-sm mb-6">Press the SOS button in an emergency. Your GPS location will be sent to all supervisors immediately.</p>

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="w-40 h-40 mx-auto rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-xl shadow-lg transition-all flex flex-col items-center justify-center gap-1"
        >
          <span className="text-3xl">🆘</span>
          SOS
        </button>
      ) : (
        <div className="space-y-4">
          <p className="font-semibold text-red-700">Are you sure you want to send an SOS alert?</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setConfirm(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button onClick={triggerSOS} disabled={loading} className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-60">
              {loading ? 'Sending...' : 'Yes, Send SOS'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
