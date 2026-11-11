import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import type { Role } from '@/lib/types'

export interface RequireAuthProps {
  children: ReactNode
  roles?: Role[]
}

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (roles && !roles.includes(session.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { session } = useAuth()

  if (session) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
