import { createClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/notifications'
import { NextResponse } from 'next/server'

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { latitude, longitude } = await req.json()
  if (!latitude || !longitude) return NextResponse.json({ ok: true })

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  // Get all geofenced locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, latitude, longitude, geofence_radius')
    .not('geofence_radius', 'is', null)
    .not('latitude', 'is', null)

  for (const loc of locations ?? []) {
    const distance = distanceMeters(latitude, longitude, Number(loc.latitude), Number(loc.longitude))
    if (distance > loc.geofence_radius) {
      // Check if we already alerted in last 30 minutes to avoid spam
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const { data: recent } = await supabase
        .from('geofence_alerts')
        .select('id')
        .eq('guard_id', user.id)
        .eq('location_id', loc.id)
        .gte('created_at', since)

      if (!recent || recent.length === 0) {
        await supabase.from('geofence_alerts').insert({
          guard_id: user.id,
          location_id: loc.id,
          latitude,
          longitude,
          distance_meters: Math.round(distance),
        })

        await sendNotification({
          title: `⚠️ Geofence Alert — ${profile?.full_name}`,
          body: `${profile?.full_name} is ${Math.round(distance)}m outside the geofence boundary for "${loc.name}" (limit: ${loc.geofence_radius}m).`,
          type: 'general',
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
