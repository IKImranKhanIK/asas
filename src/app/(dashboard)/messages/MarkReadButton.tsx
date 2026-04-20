'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarkReadButton({ messageId, userId }: { messageId: string; userId: string }) {
  const router = useRouter()

  async function markRead() {
    const supabase = createClient()
    const { data } = await supabase.from('messages').select('read_by').eq('id', messageId).single()
    const readBy = data?.read_by ?? []
    if (!readBy.includes(userId)) {
      await supabase.from('messages').update({ read_by: [...readBy, userId] }).eq('id', messageId)
    }
    router.refresh()
  }

  return (
    <button onClick={markRead} className="shrink-0 text-xs text-blue-600 hover:underline">
      Mark read
    </button>
  )
}
