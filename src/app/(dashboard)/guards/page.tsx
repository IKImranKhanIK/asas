import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

const roleStyle: Record<string, string> = {
  admin:      'bg-purple-500/15 text-purple-400 border-purple-500/20',
  supervisor: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  guard:      'bg-gray-700/50 text-gray-400 border-gray-700',
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initials}
    </div>
  )
}

export default async function GuardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (!['admin', 'supervisor'].includes(profile?.role)) redirect('/dashboard')

  const { data: guards } = await supabase.from('profiles').select('*').order('full_name')

  const total = guards?.length ?? 0
  const active = guards?.filter((g: any) => g.is_active).length ?? 0

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Guards & Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total · {active} active</p>
        </div>
        <Link href="/guards/invite"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
          + Add Guard
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {guards && guards.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Badge</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {guards.map((guard: any) => (
                <tr key={guard.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={guard.full_name} />
                      <div>
                        <Link href={`/guards/${guard.id}`}
                          className="text-sm font-medium text-gray-100 hover:text-blue-400 transition-colors">
                          {guard.full_name}
                        </Link>
                        <p className="text-xs text-gray-600">{guard.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400 hidden sm:table-cell">
                    {guard.badge_number ?? <span className="text-gray-700">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge border ${roleStyle[guard.role]}`}>{guard.role}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell">
                    {guard.phone ?? <span className="text-gray-700">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge border ${guard.is_active
                      ? 'bg-green-500/15 text-green-400 border-green-500/20'
                      : 'bg-red-500/15 text-red-400 border-red-500/20'
                    }`}>
                      {guard.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden lg:table-cell">
                    {format(new Date(guard.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">No staff added yet.</p>
            <Link href="/guards/invite" className="mt-3 inline-block text-blue-400 text-sm hover:underline">
              Add your first guard →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
