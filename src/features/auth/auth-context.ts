import { createContext, useContext } from 'react'
import type { Role, Session, TenantId } from '@/lib/types'

export interface LoginInput {
  tenantId: TenantId
  role: Role
  email: string
}

export interface AuthContextValue {
  session: Session | null
  login: (input: LoginInput) => Session
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}
