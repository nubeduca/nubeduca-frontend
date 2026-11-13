import { HttpResponse } from 'msw'
import { ROLES, TENANTS } from '@/lib/types'
import type { Role } from '@/lib/types'
import { mockState } from '../db'
import type { AuthContext } from '../types'
import { mockId } from '../fixtures/ids'

let idCounter = 0

export function nextId(prefix: string): string {
  idCounter += 1
  return mockId(prefix, 100000 + idCounter)
}

export function getAuth(request: Request): AuthContext | null {
  const header = request.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return null
  }

  const token = header.slice('Bearer '.length).trim()
  const [scheme, tenantRaw, roleRaw, userId] = token.split('.')
  if (scheme !== 'mock' || !tenantRaw || !roleRaw || !userId) {
    return null
  }

  const tenant = TENANTS.find((item) => item.id === tenantRaw)
  if (!tenant) {
    return null
  }

  const role = roleRaw as Role
  if (!ROLES.includes(role)) {
    return null
  }

  const user = mockState.db.users.find(
    (item) => item.tenantId === tenant.id && item.userId === userId,
  )
  if (!user || user.role !== role) {
    return null
  }

  return {
    tenantId: tenant.id,
    role,
    userId,
    token,
  }
}

export function errorResponse(status: number, code: string, message: string): Response {
  return HttpResponse.json({ code, message }, { status })
}

export function unauthorized(): Response {
  return errorResponse(401, 'NO_AUTENTICADO', 'Falta el token o no es válido.')
}

export function forbidden(): Response {
  return errorResponse(403, 'SIN_PERMISO', 'No tienes permisos para esta operación.')
}

export function notFound(code: string, message: string): Response {
  return errorResponse(404, code, message)
}

export function badRequest(message = 'Los datos enviados no son válidos.'): Response {
  return errorResponse(400, 'DATOS_INVALIDOS', message)
}

export function conflict(code: string, message: string): Response {
  return errorResponse(409, code, message)
}

export interface Page<T> {
  items: T[]
  nextToken: string | null
}

export function paginate<T>(items: T[], request: Request): Page<T> | null {
  const url = new URL(request.url)
  const rawLimit = Number(url.searchParams.get('limit') ?? '20')
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, Math.floor(rawLimit)))
    : 20
  const nextToken = url.searchParams.get('nextToken')

  let offset = 0
  if (nextToken) {
    try {
      offset = Number(atob(nextToken))
    } catch {
      return null
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return null
    }
  }

  return {
    items: items.slice(offset, offset + limit),
    nextToken: offset + limit < items.length ? btoa(String(offset + limit)) : null,
  }
}

export async function readJson(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return null
    }
    return body as Record<string, unknown>
  } catch {
    return null
  }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
