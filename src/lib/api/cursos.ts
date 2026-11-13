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

export function listCourses(params: ListCoursesParams = {}): Promise<CoursePage> {
  return api.get<CoursePage>('cursos', `/courses${buildQuery(params)}`)
}

export function getCourse(courseId: string): Promise<Course> {
  return api.get<Course>('cursos', `/courses/${encodeURIComponent(courseId)}`)
}

export function createCourse(input: CourseInput): Promise<Course> {
  return api.post<Course>('cursos', '/courses', input)
}

export function updateCourse(courseId: string, input: CourseUpdate): Promise<Course> {
  return api.patch<Course>('cursos', `/courses/${encodeURIComponent(courseId)}`, input)
}

export function publishCourse(courseId: string): Promise<Course> {
  return api.post<Course>('cursos', `/courses/${encodeURIComponent(courseId)}/publish`)
}

export function archiveCourse(courseId: string): Promise<Course> {
  return api.post<Course>('cursos', `/courses/${encodeURIComponent(courseId)}/archive`)
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
  return api.get<EnrollmentPage>(
    'cursos',
    `/courses/${encodeURIComponent(courseId)}/enrollments${buildQuery(params)}`,
  )
}

export function createEnrollment(
  courseId: string,
  input: EnrollmentInput,
): Promise<Enrollment> {
  return api.post<Enrollment>(
    'cursos',
    `/courses/${encodeURIComponent(courseId)}/enrollments`,
    input,
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
  return api.delete<void>(
    'cursos',
    `/courses/${encodeURIComponent(courseId)}/enrollments/${encodeURIComponent(enrollmentId)}`,
  )
}
