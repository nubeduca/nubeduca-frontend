import { Cloud, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/cn'
import { ROLE_LABELS, TENANT_LABELS } from '@/lib/types'
import { navItemsForRole } from './navigation'

export interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { session } = useAuth()
  const items = session ? navItemsForRole(session.role) : []

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Cloud className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Nubeduca</p>
              <p className="text-xs text-slate-500">LMS multi-tenant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menú principal">
          <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Módulos
          </p>
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-4">
          {session ? (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <p className="font-medium text-slate-700">
                {TENANT_LABELS[session.tenantId]} · {ROLE_LABELS[session.role]}
              </p>
              <p className="mt-1 break-all">{session.email}</p>
            </div>
          ) : null}
          <p className="mt-3 px-1 text-[11px] text-slate-400">Fase 1 · MVP académico</p>
        </div>
      </aside>
    </>
  )
}
