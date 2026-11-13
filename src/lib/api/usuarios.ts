import type { Role } from '@/lib/types'
import { api } from './client'
import { buildQuery } from './query'
import type { TermPage, User, UserPage } from './types'

export interface ListUsersParams {
  role?: Role
  institutionalCode?: string
  limit?: number
  nextToken?: string | null
}

export interface ListTermsParams {
  limit?: number
  nextToken?: string | null
}

export function listTerms(params: ListTermsParams = {}): Promise<TermPage> {
  return api.get<TermPage>('usuarios', `/terms${buildQuery(params)}`)
}

export function listUsers(params: ListUsersParams = {}): Promise<UserPage> {
  return api.get<UserPage>('usuarios', `/users${buildQuery(params)}`)
}

export function getUser(userId: string): Promise<User> {
  return api.get<User>('usuarios', `/users/${encodeURIComponent(userId)}`)
}

export function getMe(): Promise<User> {
  return api.get<User>('usuarios', '/users/me')
}

/** Crea mi perfil si no existe (idempotente). Se llama justo después del login. */
export function provisionMe(): Promise<User> {
  return api.post<User>('usuarios', '/users/me')
}
