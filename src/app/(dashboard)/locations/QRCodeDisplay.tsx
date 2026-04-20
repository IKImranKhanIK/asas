'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export default function QRCodeDisplay({ qrCode, locationName }: { qrCode: string; locationName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && qrCode) {
      QRCode.toCanvas(canvasRef.current, qrCode, { width: 120, margin: 1 })
    }
  }, [qrCode])

  function download() {
    const link = document.createElement('a')
    link.download = `${locationName}-qr.png`
    link.href = canvasRef.current?.toDataURL() ?? ''
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <canvas ref={canvasRef} className="rounded" />
      <button
        onClick={download}
        className="text-xs text-blue-600 hover:underline"
      >
        Download QR
      </button>
    </div>
  )
}
