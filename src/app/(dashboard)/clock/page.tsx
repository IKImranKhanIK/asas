import { createClient } from '@/lib/supabase/server'
import ClockPanel from './ClockPanel'
import { format } from 'date-fns'

export default async function ClockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayEvents } = await supabase
    .from('clock_events')
    .select('*')
    .eq('guard_id', user!.id)
    .gte('timestamp', today.toISOString())
    .order('timestamp', { ascending: false })

  const lastEvent = todayEvents?.[0]
  const isClockedIn = lastEvent?.type === 'clock_in'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Clock In / Out</h1>
      <ClockPanel guardId={user!.id} isClockedIn={isClockedIn} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Today&apos;s Activity</h2>
        {todayEvents && todayEvents.length > 0 ? (
          <div className="space-y-2">
            {todayEvents.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${event.type === 'clock_in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {event.type === 'clock_in' ? '▲ Clock In' : '▼ Clock Out'}
                </span>
                <span className="text-sm text-gray-500">{format(new Date(event.timestamp), 'h:mm a')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No activity recorded today.</p>
        )}
      </div>
    </div>
  )
}
