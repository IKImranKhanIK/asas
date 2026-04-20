import { type Profile } from '@/types'

export default function TopBar({ user }: { user: Profile | null }) {
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const roleLabel = { admin: 'Administrator', supervisor: 'Supervisor', guard: 'Security Guard' }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{user?.full_name ?? 'Unknown'}</p>
          <p className="text-xs text-gray-500">{roleLabel[user?.role ?? 'guard']}</p>
        </div>
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {initials}
        </div>
      </div>
    </header>
  )
}
