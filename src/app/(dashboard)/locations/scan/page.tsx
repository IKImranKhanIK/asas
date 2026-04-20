import QRScanner from './QRScanner'

export default function ScanPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Scan Location QR</h1>
      <p className="text-sm text-gray-500">Point your camera at a location QR code to log a check-in.</p>
      <QRScanner />
    </div>
  )
}
