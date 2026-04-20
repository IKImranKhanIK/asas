import { createClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/notifications'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: Request) {
  // Protect with a secret so only Vercel cron can call this
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  // Check 1: Guards who haven't clocked in today
  const { data: activeGuards } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'guard')
    .eq('is_active', true)

  const { data: todayClockIns } = await admin
    .from('clock_events')
    .select('guard_id')
    .eq('type', 'clock_in')
    .gte('timestamp', todayStart.toISOString())

  const clockedInIds = new Set(todayClockIns?.map(e => e.guard_id) ?? [])

  const notClockedIn = (activeGuards ?? []).filter(g => !clockedInIds.has(g.id))

  // Only alert if it's past 8am and guards haven't clocked in
  if (now.getHours() >= 8 && notClockedIn.length > 0) {
    const names = notClockedIn.map(g => g.full_name).join(', ')
    await sendNotification({
      title: `${notClockedIn.length} guard(s) haven't clocked in today`,
      body: `The following guards have not clocked in today: ${names}. Please follow up.`,
      type: 'missed_clockin',
    })
  }

  // Check 2: Missed patrol schedule check-ins
  const { data: schedules } = await admin
    .from('patrol_schedules')
    .select('*, location:locations(name), guard:profiles(full_name)')
    .eq('is_active', true)

  for (const schedule of schedules ?? []) {
    const windowStart = new Date(now.getTime() - schedule.interval_minutes * 60 * 1000)

    const query = admin
      .from('location_checks')
      .select('id')
      .eq('location_id', schedule.location_id)
      .gte('timestamp', windowStart.toISOString())

    if (schedule.guard_id) {
      query.eq('guard_id', schedule.guard_id)
    }

    const { data: recentChecks } = await query

    if (!recentChecks || recentChecks.length === 0) {
      const guardName = schedule.guard?.full_name ?? 'Any guard'
      const locationName = schedule.location?.name ?? 'Unknown location'
      await sendNotification({
        title: `Missed patrol check-in at ${locationName}`,
        body: `${guardName} was scheduled to check in at ${locationName} every ${schedule.interval_minutes} minutes but no check-in was recorded in the last ${schedule.interval_minutes} minutes.`,
        type: 'missed_checkin',
      })
    }
  }

  return NextResponse.json({ ok: true, checked: new Date().toISOString() })
}
