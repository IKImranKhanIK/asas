import { createClient } from '@/lib/supabase/server'
import ClockPanel from './ClockPanel'
import { format } from 'date-fns'

export default async function ClockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const { data: todayEvents } = await supabase
    .from('clock_events').select('*')
    .eq('guard_id', user!.id)
    .gte('timestamp', today.toISOString())
    .order('timestamp', { ascending: false })

  const lastEvent = todayEvents?.[0]
  const isClockedIn = lastEvent?.type === 'clock_in'

  // Calculate hours worked today
  let hoursToday = 0
  if (todayEvents && todayEvents.length > 0) {
    const events = [...todayEvents].reverse()
    for (let i = 0; i < events.length - 1; i++) {
      if (events[i].type === 'clock_in' && events[i + 1].type === 'clock_out') {
        hoursToday += (new Date(events[i + 1].timestamp).getTime() - new Date(events[i].timestamp).getTime()) / 3600000
      }
    }
    if (isClockedIn) {
      hoursToday += (Date.now() - new Date(lastEvent.timestamp).getTime()) / 3600000
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Clock In / Out</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {profile?.full_name} · Badge {profile?.badge_number ?? 'N/A'}
        </p>
      </div>

      <ClockPanel guardId={user!.id} isClockedIn={isClockedIn} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{hoursToday.toFixed(1)}h</p>
          <p className="text-xs text-gray-500 mt-1">Hours today</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{todayEvents?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Events today</p>
        </div>
      </div>

      {/* Today's activity log */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-100">Today&apos;s Activity</h2>
        </div>
        {todayEvents && todayEvents.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {todayEvents.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${event.type === 'clock_in' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${event.type === 'clock_in' ? 'text-green-400' : 'text-red-400'}`}>
                    {event.type === 'clock_in' ? 'Clocked In' : 'Clocked Out'}
                  </span>
                  {event.notes && <span className="text-xs text-gray-600 truncate max-w-32">{event.notes}</span>}
                </div>
                <span className="text-sm text-gray-500">{format(new Date(event.timestamp), 'h:mm a')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-gray-600 text-sm">No activity recorded today.</div>
        )}
      </div>
    </div>
  )
}
