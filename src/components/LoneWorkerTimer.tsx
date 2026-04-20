'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const CHECK_IN_INTERVAL = 30 * 60 * 1000 // 30 minutes

export default function LoneWorkerTimer({ guardId }: { guardId: string }) {
  const [active, setActive] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(CHECK_IN_INTERVAL / 1000)
  const [overdue, setOverdue] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function start() {
    setActive(true)
    setOverdue(false)
    setSecondsLeft(CHECK_IN_INTERVAL / 1000)

    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setOverdue(true)
          triggerAlert()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  function checkIn() {
    setOverdue(false)
    setSecondsLeft(CHECK_IN_INTERVAL / 1000)
  }

  function stop() {
    setActive(false)
    setOverdue(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  async function triggerAlert() {
    await fetch('/api/sos/lone-worker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardId }),
    })
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function fmt(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={`rounded-xl border p-5 ${overdue ? 'bg-red-50 border-red-300' : active ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Lone Worker Timer</h3>
        {active && (
          <span className={`text-2xl font-bold font-mono ${overdue ? 'text-red-600' : 'text-green-700'}`}>
            {overdue ? 'OVERDUE' : fmt(secondsLeft)}
          </span>
        )}
      </div>

      {overdue && (
        <p className="text-sm text-red-700 mb-3 font-medium">⚠️ You haven't checked in — your supervisor has been alerted.</p>
      )}

      {!active ? (
        <div>
          <p className="text-sm text-gray-500 mb-3">Enable lone worker protection. You must check in every 30 minutes or your supervisor will be alerted.</p>
          <button onClick={start} className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm">
            Enable Lone Worker Protection
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={checkIn} className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 text-sm">
            ✓ Check In
          </button>
          <button onClick={stop} className="px-4 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 text-sm">
            Stop
          </button>
        </div>
      )}
    </div>
  )
}
