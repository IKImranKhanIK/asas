import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()

  if (id === 'all') {
    await supabase.from('notifications').update({ read: true }).eq('recipient_id', user.id)
  } else {
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('recipient_id', user.id)
  }

  return NextResponse.json({ ok: true })
}
