import type { Course, Enrollment } from '@/lib/api/types'
import type { TenantId } from '@/lib/types'
import { mockState } from './db'

/**
 * Puente del modo mixto: cuando ms-cursos es real y contenidos, evaluaciones y
 * calificaciones siguen simulados, los mocks tienen que conocer los cursos y las
 * matrículas reales (findCourse / isEnrolled en handlers/course-access.ts).
 * src/lib/api/cursos.ts copia aquí lo que responde la API real.
 */

export function mirrorCourses(tenantId: TenantId, courses: readonly Course[]): void {
  for (const course of courses) {
    const index = mockState.db.courses.findIndex(
      (item) => item.tenantId === tenantId && item.courseId === course.courseId,
    )
    const copy = { ...course, tenantId }
    if (index >= 0) {
      mockState.db.courses[index] = copy
    } else {
      mockState.db.courses.push(copy)
    }
  }
}

export function mirrorEnrollments(
  tenantId: TenantId,
  courseId: string,
  enrollments: readonly Enrollment[],
): void {
  for (const enrollment of enrollments) {
    const exists = mockState.db.enrollments.some(
      (item) => item.courseId === courseId && item.userId === enrollment.userId,
    )
    if (!exists) {
      mockState.db.enrollments.push({ ...enrollment, tenantId, courseId })
    }
  }
}

/** El alumno ve un curso real solo si está matriculado: se registra su matrícula. */
export function mirrorStudentEnrollment(
  tenantId: TenantId,
  courseId: string,
  userId: string,
): void {
  mirrorEnrollments(tenantId, courseId, [
    {
      enrollmentId: `enr_${courseId.slice(4)}`,
      userId,
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
    },
  ])
}

export function removeEnrollment(courseId: string, enrollmentId: string): void {
  mockState.db.enrollments = mockState.db.enrollments.filter(
    (item) => !(item.courseId === courseId && item.enrollmentId === enrollmentId),
  )
}
