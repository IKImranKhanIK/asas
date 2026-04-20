import { createClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/notifications'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { guardId } = await req.json()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await admin.from('profiles').select('full_name, badge_number, phone').eq('id', guardId).single()

  await sendNotification({
    title: `⚠️ Lone Worker Alert — ${profile?.full_name}`,
    body: `${profile?.full_name} (Badge: ${profile?.badge_number ?? 'N/A'}, Phone: ${profile?.phone ?? 'N/A'}) has not checked in within 30 minutes. Please verify their safety immediately.`,
    type: 'general',
  })

  return NextResponse.json({ ok: true })
}
