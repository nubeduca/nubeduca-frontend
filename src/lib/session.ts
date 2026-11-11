import { ROLES, TENANTS, type Role, type Session, type TenantId } from '@/lib/types'

const SESSION_KEY = 'nubeduca.session'

function isTenantId(value: unknown): value is TenantId {
  return TENANTS.some((tenant) => tenant.id === value)
}

function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role === value)
}

export function readSession(): Session | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Session>
    if (
      !isTenantId(parsed.tenantId) ||
      !isRole(parsed.role) ||
      typeof parsed.email !== 'string' ||
      typeof parsed.name !== 'string' ||
      typeof parsed.token !== 'string'
    ) {
      return null
    }
    return parsed as Session
  } catch {
    return null
  }
}

export function writeSession(session: Session): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY)
}
