import { IS_MOCK_MODE, REAL_SERVICES } from '@/lib/env'
import { readSession } from '@/lib/session'
import { api } from './client'
import { buildQuery } from './query'
import type {
  Course,
  CourseInput,
  CoursePage,
  CourseStatus,
  CourseUpdate,
  Enrollment,
  EnrollmentInput,
  EnrollmentPage,
  ImportResult,
  Section,
  SectionInput,
  SectionList,
} from './types'

export interface ListCoursesParams {
  termId?: string
  status?: CourseStatus
  limit?: number
  nextToken?: string | null
}

export interface ListEnrollmentsParams {
  role?: 'STUDENT' | 'TEACHER'
  limit?: number
  nextToken?: string | null
}

/**
 * Modo mixto con ms-cursos real: lo que responde se copia a los mocks (lib/mocks/bridge)
 * para que contenidos, evaluaciones y calificaciones simulados reconozcan los cursos.
 */
const MIRROR = IS_MOCK_MODE && REAL_SERVICES.includes('cursos')

type Bridge = typeof import('@/lib/mocks/bridge')
type MirrorSession = NonNullable<ReturnType<typeof readSession>>

async function mirror<T>(
  result: Promise<T>,
  apply: (bridge: Bridge, value: T, session: MirrorSession) => void,
): Promise<T> {
  const value = await result
  const session = readSession()
  if (MIRROR && session) {
    apply(await import('@/lib/mocks/bridge'), value, session)
  }
  return value
}

/**
 * Las matrículas de los cursos del docente se copian una vez por sesión, así el libro de
 * notas y las entregas simuladas conocen a los alumnos aunque no se abra el panel.
 */
const syncedEnrollments = new Set<string>()

function syncTeacherEnrollments(
  courses: readonly Course[],
  session: MirrorSession,
): void {
  if (session.role !== 'TEACHER') {
    return
  }
  for (const course of courses) {
    if (course.ownerId !== session.userId || syncedEnrollments.has(course.courseId)) {
      continue
    }
    syncedEnrollments.add(course.courseId)
    listEnrollments(course.courseId, { limit: 100 }).catch(() =>
      syncedEnrollments.delete(course.courseId),
    )
  }
}

function mirrorCourse(result: Promise<Course>): Promise<Course> {
  return mirror(result, (bridge, course, session) =>
    bridge.mirrorCourses(session.tenantId, [course]),
  )
}

export function listCourses(params: ListCoursesParams = {}): Promise<CoursePage> {
  return mirror(
    api.get<CoursePage>('cursos', `/courses${buildQuery(params)}`),
    (bridge, page, session) => {
      bridge.mirrorCourses(session.tenantId, page.items)
      syncTeacherEnrollments(page.items, session)
      if (session.role === 'STUDENT') {
        for (const course of page.items) {
          bridge.mirrorStudentEnrollment(
            session.tenantId,
            course.courseId,
            session.userId,
          )
        }
      }
    },
  )
}

export function getCourse(courseId: string): Promise<Course> {
  return mirror(
    api.get<Course>('cursos', `/courses/${encodeURIComponent(courseId)}`),
    (bridge, course, session) => {
      bridge.mirrorCourses(session.tenantId, [course])
      syncTeacherEnrollments([course], session)
      if (session.role === 'STUDENT') {
        bridge.mirrorStudentEnrollment(session.tenantId, course.courseId, session.userId)
      }
    },
  )
}

export function createCourse(input: CourseInput): Promise<Course> {
  return mirrorCourse(api.post<Course>('cursos', '/courses', input))
}

export function updateCourse(courseId: string, input: CourseUpdate): Promise<Course> {
  return mirrorCourse(
    api.patch<Course>('cursos', `/courses/${encodeURIComponent(courseId)}`, input),
  )
}

export function publishCourse(courseId: string): Promise<Course> {
  return mirrorCourse(
    api.post<Course>('cursos', `/courses/${encodeURIComponent(courseId)}/publish`),
  )
}

export function archiveCourse(courseId: string): Promise<Course> {
  return mirrorCourse(
    api.post<Course>('cursos', `/courses/${encodeURIComponent(courseId)}/archive`),
  )
}

export function listSections(courseId: string): Promise<SectionList> {
  return api.get<SectionList>(
    'cursos',
    `/courses/${encodeURIComponent(courseId)}/sections`,
  )
}

export function createSection(courseId: string, input: SectionInput): Promise<Section> {
  return api.post<Section>(
    'cursos',
    `/courses/${encodeURIComponent(courseId)}/sections`,
    input,
  )
}

export function listEnrollments(
  courseId: string,
  params: ListEnrollmentsParams = {},
): Promise<EnrollmentPage> {
  return mirror(
    api.get<EnrollmentPage>(
      'cursos',
      `/courses/${encodeURIComponent(courseId)}/enrollments${buildQuery(params)}`,
    ),
    (bridge, page, session) =>
      bridge.mirrorEnrollments(session.tenantId, courseId, page.items),
  )
}

export function createEnrollment(
  courseId: string,
  input: EnrollmentInput,
): Promise<Enrollment> {
  return mirror(
    api.post<Enrollment>(
      'cursos',
      `/courses/${encodeURIComponent(courseId)}/enrollments`,
      input,
    ),
    (bridge, enrollment, session) =>
      bridge.mirrorEnrollments(session.tenantId, courseId, [enrollment]),
  )
}

export function importEnrollments(courseId: string, csv: string): Promise<ImportResult> {
  return api.postRaw<ImportResult>(
    'cursos',
    `/courses/${encodeURIComponent(courseId)}/enrollments/import`,
    csv,
    'text/csv',
  )
}

export function dropEnrollment(courseId: string, enrollmentId: string): Promise<void> {
  return mirror(
    api.delete<void>(
      'cursos',
      `/courses/${encodeURIComponent(courseId)}/enrollments/${encodeURIComponent(enrollmentId)}`,
    ),
    (bridge) => bridge.removeEnrollment(courseId, enrollmentId),
  )
}
