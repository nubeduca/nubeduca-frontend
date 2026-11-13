import { http, HttpResponse } from 'msw'
import type { Preferences } from '@/lib/api/types'
import { mockState } from '../db'
import { toNotification } from '../mappers'
import { badRequest, getAuth, paginate, readJson, unauthorized } from './utils'

const PREFERENCE_KEYS = [
  'coursePublished',
  'announcements',
  'modules',
  'assignments',
  'submissionReceipts',
  'grades',
] as const

function defaultPreferences(): Preferences {
  return {
    email: {
      coursePublished: true,
      announcements: true,
      modules: true,
      assignments: true,
      submissionReceipts: true,
      grades: true,
    },
  }
}

function parsePreferences(body: Record<string, unknown>): Preferences | null {
  const email = body.email
  if (typeof email !== 'object' || email === null || Array.isArray(email)) {
    return null
  }

  const values = email as Record<string, unknown>
  if (!PREFERENCE_KEYS.every((key) => typeof values[key] === 'boolean')) {
    return null
  }

  return {
    email: {
      coursePublished: values.coursePublished as boolean,
      announcements: values.announcements as boolean,
      modules: values.modules as boolean,
      assignments: values.assignments as boolean,
      submissionReceipts: values.submissionReceipts as boolean,
      grades: values.grades as boolean,
    },
  }
}

export const notificacionHandlers = [
  http.get('/mock-api/notificaciones/notifications/me', ({ request }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const notifications = mockState.db.notifications
      .filter(
        (notification) =>
          notification.tenantId === auth.tenantId && notification.userId === auth.userId,
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

    const page = paginate(notifications, request)
    if (!page) {
      return badRequest('El token de paginación no es válido.')
    }

    return HttpResponse.json({
      items: page.items.map(toNotification),
      nextToken: page.nextToken,
    })
  }),

  http.get('/mock-api/notificaciones/preferences/me', ({ request }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const stored = mockState.db.preferences.find(
      (item) => item.tenantId === auth.tenantId && item.userId === auth.userId,
    )

    return HttpResponse.json(stored ? stored.preferences : defaultPreferences())
  }),

  http.put('/mock-api/notificaciones/preferences/me', async ({ request }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const body = await readJson(request)
    if (!body) {
      return badRequest()
    }

    const preferences = parsePreferences(body)
    if (!preferences) {
      return badRequest('Las preferencias no son válidas.')
    }

    const stored = mockState.db.preferences.find(
      (item) => item.tenantId === auth.tenantId && item.userId === auth.userId,
    )
    if (stored) {
      stored.preferences = preferences
    } else {
      mockState.db.preferences.push({
        tenantId: auth.tenantId,
        userId: auth.userId,
        preferences,
      })
    }

    return HttpResponse.json(preferences)
  }),
]
