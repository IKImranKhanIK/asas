'use client'

import { useEffect, useRef } from 'react'

interface GuardPin {
  guard_id: string
  latitude: number
  longitude: number
  timestamp: string
  guard: { full_name: string; badge_number?: string } | null
}

interface LocationCheck {
  id: string
  latitude: number
  longitude: number
  timestamp: string
  guard: { full_name: string } | null
  location: { name: string; latitude?: number; longitude?: number } | null
}

export default function GuardMap({ guards, locationChecks }: { guards: GuardPin[]; locationChecks: LocationCheck[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const defaultCenter: [number, number] = guards.length > 0
        ? [guards[0].latitude, guards[0].longitude]
        : [29.7604, -95.3698] // Houston, TX default

      const map = L.map(mapRef.current!).setView(defaultCenter, 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const guardIcon = L.divIcon({
        html: `<div style="background:#2563eb;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);font-size:12px;font-weight:bold;">G</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: '',
      })

      const locationIcon = L.divIcon({
        html: `<div style="background:#16a34a;color:white;border-radius:4px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);font-size:11px;">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: '',
      })

      guards.forEach(g => {
        L.marker([g.latitude, g.longitude], { icon: guardIcon })
          .bindPopup(`<strong>${g.guard?.full_name ?? 'Guard'}</strong><br/>Badge: ${g.guard?.badge_number ?? 'N/A'}<br/><span style="color:#6b7280;font-size:12px;">Clocked in ${new Date(g.timestamp).toLocaleTimeString()}</span>`)
          .addTo(map)
      })

      locationChecks.forEach(c => {
        if (!c.latitude || !c.longitude) return
        L.marker([c.latitude, c.longitude], { icon: locationIcon })
          .bindPopup(`<strong>${c.location?.name ?? 'Location'}</strong><br/>${c.guard?.full_name ?? ''}<br/><span style="color:#6b7280;font-size:12px;">${new Date(c.timestamp).toLocaleTimeString()}</span>`)
          .addTo(map)
      })

      if (guards.length > 1) {
        const bounds = L.latLngBounds(guards.map(g => [g.latitude, g.longitude]))
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    }

    initMap()

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full" />
          <span className="text-gray-600">Guard (clocked in today)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded" />
          <span className="text-gray-600">Location check-in</span>
        </div>
      </div>
      <div ref={mapRef} className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-sm" />
      {guards.length === 0 && (
        <p className="text-center text-sm text-gray-400">No guards have clocked in with GPS today.</p>
      )}
    </div>
  )
}
