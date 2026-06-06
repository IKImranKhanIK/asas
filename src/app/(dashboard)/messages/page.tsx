import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = ['admin', 'supervisor'].includes(profile?.role)

  const { data: messages } = await supabase
    .from('guard_messages')
    .select('*, sender:profiles!guard_messages_sender_id_fkey(full_name, role)')
    .or(`recipient_id.eq.${user!.id},is_broadcast.eq.true,sender_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">{messages?.length ?? 0} messages</p>
        </div>
        {isAdmin && (
          <Link href="/messages/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
            + New Message
          </Link>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
        {messages && messages.length > 0 ? messages.map((msg: any) => {
          const isMine = msg.sender_id === user!.id
          const initials = msg.sender?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
          return (
            <div key={msg.id} className={`p-5 flex items-start gap-4 ${!msg.is_read && !isMine ? 'bg-blue-500/5' : ''}`}>
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-semibold text-gray-100">{msg.sender?.full_name}</p>
                  {msg.is_broadcast && (
                    <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/20">Broadcast</span>
                  )}
                  {isMine && (
                    <span className="badge bg-gray-700/50 text-gray-500 border border-gray-700">Sent</span>
                  )}
                  {!msg.is_read && !isMine && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                {msg.subject && <p className="text-sm font-medium text-gray-200 mb-0.5">{msg.subject}</p>}
                <p className="text-sm text-gray-400 line-clamp-2">{msg.body}</p>
                <p className="text-xs text-gray-600 mt-1.5">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</p>
              </div>
            </div>
          )
        }) : (
          <div className="py-16 text-center text-gray-600 text-sm">No messages yet.</div>
        )}
      </div>
    </div>
  )
}
