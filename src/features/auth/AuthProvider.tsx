import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { clearSession, readSession, writeSession } from '@/lib/session'
import type { Session } from '@/lib/types'
import { AuthContext, type LoginInput } from './auth-context'

function displayNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? 'Usuario'
  const words = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(' ')

  return (
    words
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Usuario'
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const login = useCallback((input: LoginInput) => {
    const newSession: Session = {
      ...input,
      name: displayNameFromEmail(input.email),
      token: `mock.${input.tenantId}.${input.role}.${crypto.randomUUID()}`,
    }

    writeSession(newSession)
    setSession(newSession)
    return newSession
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
