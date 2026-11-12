import { mockState } from '../db'
import type { AuthContext, MockCourse, MockModule } from '../types'

export function findCourse(auth: AuthContext, courseId: string): MockCourse | undefined {
  return mockState.db.courses.find(
    (course) => course.tenantId === auth.tenantId && course.courseId === courseId,
  )
}

export function findModule(
  auth: AuthContext,
  courseId: string,
  moduleId: string,
): MockModule | undefined {
  return mockState.db.modules.find(
    (module) =>
      module.tenantId === auth.tenantId &&
      module.courseId === courseId &&
      module.moduleId === moduleId,
  )
}

export function isEnrolled(courseId: string, userId: string): boolean {
  return mockState.db.enrollments.some(
    (enrollment) => enrollment.courseId === courseId && enrollment.userId === userId,
  )
}

export function isCourseTeacher(auth: AuthContext, course: MockCourse): boolean {
  return auth.role === 'TEACHER' && course.ownerId === auth.userId
}

export function canSeeCourse(auth: AuthContext, course: MockCourse): boolean {
  if (auth.role === 'ADMIN') {
    return true
  }
  if (auth.role === 'TEACHER') {
    return isCourseTeacher(auth, course)
  }
  return course.status === 'PUBLISHED' && isEnrolled(course.courseId, auth.userId)
}

export function canManageCourse(auth: AuthContext, course: MockCourse): boolean {
  return auth.role === 'ADMIN' || isCourseTeacher(auth, course)
}

export function canManageModules(auth: AuthContext, course: MockCourse): boolean {
  return isCourseTeacher(auth, course)
}
