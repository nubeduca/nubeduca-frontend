import type { Role } from '@/lib/types'

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface CourseInput {
  termId: string
  code: string
  title: string
  description?: string
}

export interface CourseUpdate {
  title?: string
  description?: string
}

export interface Course extends CourseInput {
  courseId: string
  status: CourseStatus
  ownerId: string
  createdAt: string
}

export interface CoursePage {
  items: Course[]
  nextToken: string | null
}

export interface Section {
  sectionId: string
  name: string
}

export interface SectionInput {
  name: string
}

export interface SectionList {
  items: Section[]
}

export interface EnrollmentInput {
  userId: string
  role: 'STUDENT' | 'TEACHER'
  sectionId?: string
}

export interface Enrollment extends EnrollmentInput {
  enrollmentId: string
  createdAt: string
}

export interface EnrollmentPage {
  items: Enrollment[]
  nextToken: string | null
}

export interface ImportError {
  line: number
  institutionalCode: string
  code: string
}

export interface ImportResult {
  created: number
  skipped: number
  errors: ImportError[]
}

export type TermStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED'

export interface Term {
  termId: string
  name: string
  startsOn: string
  endsOn: string
  status: TermStatus
}

export interface TermPage {
  items: Term[]
  nextToken: string | null
}

export interface User {
  userId: string
  role: Role
  institutionalCode?: string | null
  givenName: string
  familyName: string
  email: string
  locale?: string
  timeZone?: string
  createdAt: string
}

export interface UserPage {
  items: User[]
  nextToken: string | null
}

export type ModuleStatus = 'DRAFT' | 'PUBLISHED'

export type ModuleItemType = 'PAGE' | 'FILE' | 'LINK'

export interface ModuleInput {
  title: string
  position: number
}

export interface ModuleUpdate {
  title?: string
  position?: number
}

export interface ModuleItemInput {
  type: ModuleItemType
  title: string
  body?: string
  fileId?: string
  url?: string
}

export interface ModuleItem extends ModuleItemInput {
  itemId: string
  position: number
}

export interface Module {
  moduleId: string
  title: string
  position: number
  status: ModuleStatus
  items: ModuleItem[]
}

export interface ModuleList {
  items: Module[]
}

export type NotificationType =
  | 'COURSE_PUBLISHED'
  | 'ANNOUNCEMENT'
  | 'MODULE'
  | 'ASSIGNMENT'
  | 'SUBMISSION_RECEIPT'
  | 'GRADE'

export type NotificationStatus = 'SENT' | 'FAILED' | 'SKIPPED_BY_PREFERENCE'

export interface Notification {
  notificationId: string
  type: NotificationType
  title: string
  courseId?: string
  status: NotificationStatus
  createdAt: string
}

export interface NotificationPage {
  items: Notification[]
  nextToken: string | null
}

export interface Preferences {
  email: {
    coursePublished: boolean
    announcements: boolean
    modules: boolean
    assignments: boolean
    submissionReceipts: boolean
    grades: boolean
  }
}

export interface Health {
  status: 'ok'
  service: string
  version: string
}
