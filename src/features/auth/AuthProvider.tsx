import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { SESSION_EXPIRED_EVENT } from '@/lib/api/client'
import { provisionMe } from '@/lib/api/usuarios'
import { DEMO_USER_IDS } from '@/lib/demo-users'
import { AUTH_MODE, IS_COGNITO_AUTH } from '@/lib/env'
import { clearSession, readSession, writeSession } from '@/lib/session'
import { TENANT_LABELS, type Session } from '@/lib/types'
import { AuthContext, type LoginInput } from './auth-context'
import { AuthError, cognitoSignIn, cognitoSignOut } from './cognito'

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

async function mockSession(input: LoginInput): Promise<Session> {
  const userId = DEMO_USER_IDS[input.tenantId][input.role]
  return {
    tenantId: input.tenantId,
    role: input.role,
    email: input.email,
    userId,
    name: displayNameFromEmail(input.email),
    token: `mock.${input.tenantId}.${input.role}.${userId}`,
  }
}

async function cognitoSession(input: LoginInput): Promise<Session> {
  const identity = await cognitoSignIn(input.email, input.password)

  if (identity.tenantId !== input.tenantId) {
    await cognitoSignOut()
    throw new AuthError(
      `Tu cuenta pertenece a ${TENANT_LABELS[identity.tenantId]}, no a ${TENANT_LABELS[input.tenantId]}.`,
    )
  }

  return {
    tenantId: identity.tenantId,
    role: identity.role,
    email: identity.email,
    userId: identity.userId,
    name: identity.name ?? displayNameFromEmail(identity.email),
    token: identity.idToken,
  }
}

/**
 * Crea el perfil en ms-usuarios si no existe (POST /users/me es idempotente)
 * y devuelve la sesión con el nombre del perfil. Si el servicio no responde,
 * se entra igual con el nombre que ya se tenía.
 */
async function withProfile(session: Session): Promise<Session> {
  try {
    const profile = await provisionMe()
    const name = `${profile.givenName} ${profile.familyName}`.trim()
    return name ? { ...session, name } : session
  } catch (cause) {
    console.warn('No se pudo crear o leer el perfil (POST /users/me).', cause)
    return session
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const login = useCallback(async (input: LoginInput) => {
    const base = IS_COGNITO_AUTH ? await cognitoSession(input) : await mockSession(input)

    // El cliente de API toma el token de la sesión guardada.
    writeSession(base)
    const newSession = await withProfile(base)
    writeSession(newSession)
    setSession(newSession)
    return newSession
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    if (IS_COGNITO_AUTH) {
      void cognitoSignOut()
    }
  }, [])

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout)
  }, [logout])

  const value = useMemo(
    () => ({ mode: AUTH_MODE, session, login, logout }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
