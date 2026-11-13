import { api } from './client'
import { buildQuery } from './query'
import type { NotificationPage, Preferences } from './types'

export interface ListNotificationsParams {
  limit?: number
  nextToken?: string | null
}

export function listMyNotifications(
  params: ListNotificationsParams = {},
): Promise<NotificationPage> {
  return api.get<NotificationPage>(
    'notificaciones',
    `/notifications/me${buildQuery(params)}`,
  )
}

export function getMyPreferences(): Promise<Preferences> {
  return api.get<Preferences>('notificaciones', '/preferences/me')
}

export function putMyPreferences(input: Preferences): Promise<Preferences> {
  return api.put<Preferences>('notificaciones', '/preferences/me', input)
}
