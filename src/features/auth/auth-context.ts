import { createContext, useContext } from 'react'
import type { AuthMode } from '@/lib/env'
import type { Role, Session, TenantId } from '@/lib/types'

export interface LoginInput {
  tenantId: TenantId
  /** Solo se usa en el modo mock; en Cognito el rol sale del token. */
  role: Role
  email: string
  password: string
}

export interface AuthContextValue {
  mode: AuthMode
  session: Session | null
  login: (input: LoginInput) => Promise<Session>
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
