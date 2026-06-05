'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResolveButton({ alertId }: { alertId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function resolve() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('sos_alerts').update({
      status: 'resolved',
      resolved_by: user!.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', alertId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={resolve} disabled={loading}
      className="shrink-0 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-green-600/20">
      {loading ? 'Resolving…' : 'Resolve'}
    </button>
  )
}
