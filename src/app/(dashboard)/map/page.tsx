import { createClient } from '@/lib/supabase/server'
import GuardMap from './GuardMap'

export default async function MapPage() {
  const supabase = await createClient()

  // Get guards who have clocked in today and have a location
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: activeCheckins } = await supabase
    .from('clock_events')
    .select('guard_id, latitude, longitude, timestamp, guard:profiles(full_name, badge_number)')
    .eq('type', 'clock_in')
    .gte('timestamp', today.toISOString())
    .not('latitude', 'is', null)
    .order('timestamp', { ascending: false })

  // Deduplicate — keep most recent check-in per guard
  const seen = new Set()
  const guards = (activeCheckins ?? [])
    .filter((e: any) => {
      if (seen.has(e.guard_id)) return false
      seen.add(e.guard_id)
      return true
    })
    .map((e: any) => ({
      ...e,
      guard: Array.isArray(e.guard) ? e.guard[0] ?? null : e.guard,
    }))

  const { data: locationChecks } = await supabase
    .from('location_checks')
    .select('*, guard:profiles(full_name), location:locations(name, latitude, longitude)')
    .gte('timestamp', today.toISOString())
    .not('latitude', 'is', null)
    .order('timestamp', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Live Map</h1>
      <p className="text-sm text-gray-500">Shows guards clocked in today with GPS location.</p>
      <GuardMap guards={guards} locationChecks={locationChecks ?? []} />
    </div>
  )
}
