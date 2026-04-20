import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { email, full_name, role, badge_number, phone, password } = body

  if (!email || !full_name || !password) {
    return NextResponse.json({ error: 'email, full_name, and password are required' }, { status: 400 })
  }

  // Use service role to create user without email confirmation
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })

  // Update profile with additional fields
  await admin.from('profiles').update({
    badge_number: badge_number || null,
    phone: phone || null,
    role,
  }).eq('id', newUser.user.id)

  return NextResponse.json({ success: true })
}
