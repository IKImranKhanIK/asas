import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InviteForm from './InviteForm'

export default async function InvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (!['admin', 'supervisor'].includes(profile?.role)) redirect('/dashboard')

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Guard / Staff</h1>
      <InviteForm />
    </div>
  )
}
