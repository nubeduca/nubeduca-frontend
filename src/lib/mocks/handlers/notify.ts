import type { NotificationType, Preferences } from '@/lib/api/types'
import type { TenantId } from '@/lib/types'
import { mockState } from '../db'
import { nextId } from './utils'

const PREFERENCE_BY_TYPE: Record<NotificationType, keyof Preferences['email']> = {
  COURSE_PUBLISHED: 'coursePublished',
  ANNOUNCEMENT: 'announcements',
  MODULE: 'modules',
  ASSIGNMENT: 'assignments',
  SUBMISSION_RECEIPT: 'submissionReceipts',
  GRADE: 'grades',
}

/**
 * Simula lo que hará ms-notificaciones al consumir un evento: deja un aviso en la
 * bandeja de cada usuario, marcado como omitido si lo desactivó en sus preferencias.
 */
export function notify(
  tenantId: TenantId,
  userIds: string[],
  type: NotificationType,
  title: string,
  courseId?: string,
): void {
  const createdAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

  userIds.forEach((userId) => {
    const preference = mockState.db.preferences.find(
      (item) => item.tenantId === tenantId && item.userId === userId,
    )
    const enabled = preference?.preferences.email[PREFERENCE_BY_TYPE[type]] ?? true

    mockState.db.notifications.unshift({
      tenantId,
      userId,
      notificationId: nextId('ntf'),
      type,
      title,
      courseId,
      status: enabled ? 'SENT' : 'SKIPPED_BY_PREFERENCE',
      createdAt,
    })
  })
}

export function enrolledStudents(courseId: string): string[] {
  return mockState.db.enrollments
    .filter((item) => item.courseId === courseId && item.role === 'STUDENT')
    .map((item) => item.userId)
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}
