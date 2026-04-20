import { createClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/notifications'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('full_name, badge_number').eq('id', user.id).single()

  await sendNotification({
    title: `🚨 SOS Alert — ${profile?.full_name ?? 'Guard'}`,
    body: `${profile?.full_name ?? 'A guard'} (Badge: ${profile?.badge_number ?? 'N/A'}) has triggered an SOS emergency alert. Check the SOS page immediately for their location.`,
    type: 'general',
  })

  return NextResponse.json({ ok: true })
}
