import { LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui'
import { useAuth } from '@/features/auth/auth-context'
import { ROLE_LABELS, TENANT_LABELS } from '@/lib/types'
import { NotificationBell } from './NotificationBell'

export interface TopbarProps {
  onOpenMenu: () => void
}

function initialsFromName(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'NU'
  )
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {session ? TENANT_LABELS[session.tenantId] : 'Nubeduca'}
          </p>
          <p className="truncate text-xs text-slate-500">
            {session ? ROLE_LABELS[session.role] : 'Shell del frontend'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="warning" className="hidden sm:inline-flex">
          Sesión simulada
        </Badge>
        <NotificationBell count={0} />
        {session ? (
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {initialsFromName(session.name)}
              </span>
              <div className="max-w-40">
                <p className="truncate text-sm font-medium text-slate-900">
                  {session.name}
                </p>
                <p className="truncate text-xs text-slate-500">{session.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="size-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
