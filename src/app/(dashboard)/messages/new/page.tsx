import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewMessageForm from './NewMessageForm'

export default async function NewMessagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role)) redirect('/messages')

  const { data: guards } = await supabase.from('profiles').select('id, full_name, role').eq('is_active', true).order('full_name')

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Message</h1>
      <NewMessageForm senderId={user!.id} guards={guards ?? []} />
    </div>
  )
}
