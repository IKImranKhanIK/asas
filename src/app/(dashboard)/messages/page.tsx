import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import MarkReadButton from './MarkReadButton'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = ['admin', 'supervisor'].includes(profile?.role)

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(full_name, role)')
    .or(`recipient_id.eq.${user!.id},is_broadcast.eq.true,sender_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        {isAdmin && (
          <Link href="/messages/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + New Message
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {messages && messages.length > 0 ? messages.map((msg: any) => {
          const isRead = msg.read_by?.includes(user!.id)
          const isMine = msg.sender_id === user!.id
          return (
            <div key={msg.id} className={`p-4 flex items-start gap-4 ${!isRead && !isMine ? 'bg-blue-50' : ''}`}>
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                {msg.sender?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-800">{msg.sender?.full_name}</p>
                  {msg.is_broadcast && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">Broadcast</span>}
                  {isMine && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">Sent</span>}
                </div>
                {msg.subject && <p className="text-sm font-medium text-gray-700">{msg.subject}</p>}
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{msg.body}</p>
                <p className="text-xs text-gray-400 mt-1">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</p>
              </div>
              {!isRead && !isMine && <MarkReadButton messageId={msg.id} userId={user!.id} />}
            </div>
          )
        }) : (
          <div className="p-10 text-center text-sm text-gray-400">No messages yet.</div>
        )}
      </div>
    </div>
  )
}
