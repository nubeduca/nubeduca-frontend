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

// ms-contenidos · archivos (para entregas)

export type FilePurpose = 'CONTENT' | 'SUBMISSION'

export interface UploadRequest {
  courseId: string
  purpose: FilePurpose
  fileName: string
  contentType: string
  sizeBytes: number
}

export interface UploadTicket {
  fileId: string
  uploadUrl: string
  method: 'PUT'
  headers: Record<string, string>
  expiresAt: string
}

export interface DownloadLink {
  downloadUrl: string
  expiresAt: string
}

// ms-evaluaciones

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED'

export interface AssignmentInput {
  title: string
  instructions?: string
  dueAt: string
  maxScore: number
  allowLate?: boolean
}

export interface AssignmentUpdate {
  title?: string
  instructions?: string
  dueAt?: string
  allowLate?: boolean
}

export interface Assignment extends AssignmentInput {
  assignmentId: string
  courseId: string
  status: AssignmentStatus
}

export interface AssignmentPage {
  items: Assignment[]
  nextToken: string | null
}

export interface SubmissionInput {
  fileIds: string[]
  comment?: string
}

export type SubmissionStatus = 'SUBMITTED' | 'GRADED'

export interface Submission {
  submissionId: string
  assignmentId: string
  studentId: string
  attempt: number
  fileIds: string[]
  comment?: string
  late: boolean
  status: SubmissionStatus
  score?: number | null
  feedback?: string | null
  submittedAt: string
}

export interface SubmissionPage {
  items: Submission[]
  nextToken: string | null
}

export interface GradeInput {
  score: number
  feedback?: string
}

// ms-calificaciones

export interface GradeItem {
  gradeItemId: string
  courseId: string
  title: string
  maxScore: number
  assignmentId?: string
}

export type GradeStatus = 'DRAFT' | 'POSTED'

export interface Grade {
  gradeId: string
  gradeItemId: string
  studentId: string
  score: number
  maxScore: number
  status: GradeStatus
  postedAt?: string | null
  /**
   * Propuesta compatible (campo opcional) para ms-calificaciones: sin esto el
   * alumno no sabe a qué tarea corresponde cada nota en GET /grades/me.
   */
  title?: string
  assignmentId?: string
}

export interface GradeList {
  items: Grade[]
}

export interface Gradebook {
  gradeItems: GradeItem[]
  rows: Array<{ studentId: string; grades: Grade[] }>
}

export interface PostResult {
  posted: number
}

export interface GradeOverride {
  score: number
  reason: string
}

export interface GradeHistoryEntry {
  previousScore: number | null
  score: number
  cause: 'GRADED' | 'MANUAL_OVERRIDE'
  reason?: string | null
  changedBy: string
  changedAt: string
}

export interface GradeHistory {
  items: GradeHistoryEntry[]
}
