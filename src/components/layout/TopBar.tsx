import { type Profile } from '@/types'
import Link from 'next/link'

const roleLabel: Record<string, string> = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  guard: 'Security Guard',
}

const roleDot: Record<string, string> = {
  admin: 'bg-purple-500',
  supervisor: 'bg-blue-500',
  guard: 'bg-green-500',
}

export default function TopBar({ user }: { user: Profile | null }) {
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between shrink-0">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-100 leading-tight">{user?.full_name ?? 'Unknown'}</p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${roleDot[user?.role ?? 'guard']}`} />
              <p className="text-xs text-gray-500">{roleLabel[user?.role ?? 'guard']}</p>
            </div>
          </div>
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  )
}
