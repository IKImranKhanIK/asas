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
    await supabase.from('sos_alerts').insert({ guard_id: guardId, latitude: lat, longitude: lng })
    await fetch('/api/sos/notify', { method: 'POST' })

    setSent(true)
    setConfirm(false)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-8 text-center max-w-sm mx-auto">
        <div className="text-5xl mb-4">🚨</div>
        <h2 className="text-xl font-bold text-red-400">SOS Alert Sent</h2>
        <p className="text-red-400/70 text-sm mt-2 leading-relaxed">
          Your supervisors have been notified with your location. Stay where you are and wait for assistance.
        </p>
        <button onClick={() => setSent(false)}
          className="mt-5 text-xs text-gray-500 hover:text-gray-300 underline">
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center max-w-sm mx-auto">
      <p className="text-gray-500 text-sm mb-8 leading-relaxed">
        Press SOS in an emergency. Your GPS location will be sent to all supervisors immediately.
      </p>

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="w-40 h-40 mx-auto rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold shadow-2xl shadow-red-600/40 transition-all flex flex-col items-center justify-center gap-2 border-4 border-red-500/50"
        >
          <span className="text-4xl">🆘</span>
          <span className="text-2xl font-black tracking-widest">SOS</span>
        </button>
      ) : (
        <div className="space-y-4">
          <p className="font-semibold text-red-400">Send SOS alert now?</p>
          <p className="text-xs text-gray-500">This will immediately alert all supervisors.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirm(false)}
              className="flex-1 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-medium text-sm">
              Cancel
            </button>
            <button onClick={triggerSOS} disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold disabled:opacity-50 text-sm shadow-lg shadow-red-600/20">
              {loading ? 'Sending…' : 'Yes, Send SOS'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
