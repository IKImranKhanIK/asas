'use client'

import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { createClient } from '@/lib/supabase/client'

export default function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const animRef = useRef<number>(0)

  useEffect(() => {
    let stream: MediaStream | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setStatus('scanning')
          scan()
        }
      } catch {
        setStatus('error')
        setMessage('Camera access denied. Please allow camera permissions.')
      }
    }

    function scan() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code) {
        handleCode(code.data)
        return
      }

      animRef.current = requestAnimationFrame(scan)
    }

    start()

    return () => {
      cancelAnimationFrame(animRef.current)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function handleCode(qrCode: string) {
    setStatus('idle')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: location } = await supabase
      .from('locations')
      .select('id, name')
      .eq('qr_code', qrCode)
      .single()

    if (!location) {
      setStatus('error')
      setMessage('Unknown QR code. This location is not registered.')
      return
    }

    let lat: number | undefined
    let lng: number | undefined
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      )
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch {}

    const { error } = await supabase.from('location_checks').insert({
      guard_id: user!.id,
      location_id: location.id,
      latitude: lat,
      longitude: lng,
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('success')
      setMessage(`Checked in at: ${location.name}`)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-square max-w-sm mx-auto">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-blue-400 rounded-lg opacity-70" />
          </div>
        )}
      </div>

      {status === 'success' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-medium">
          ✓ {message}
        </div>
      )}
      {status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {message}
        </div>
      )}
      {status === 'scanning' && (
        <p className="text-center text-sm text-gray-400">Scanning… point camera at a QR code</p>
      )}
    </div>
  )
}
