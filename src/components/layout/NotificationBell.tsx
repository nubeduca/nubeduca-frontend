import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface NotificationBellProps {
  count?: number
}

export function NotificationBell({ count = 0 }: NotificationBellProps) {
  return (
    <Link
      to="/notificaciones"
      aria-label="Notificaciones"
      className="relative flex size-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      <Bell className="size-5" aria-hidden />
      {count > 0 ? (
        <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}
