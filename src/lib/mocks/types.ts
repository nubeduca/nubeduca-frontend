import type {
  Assignment,
  Course,
  Enrollment,
  FilePurpose,
  Grade,
  GradeHistoryEntry,
  GradeItem,
  Module,
  Notification,
  Preferences,
  Section,
  Submission,
  Term,
  User,
} from '@/lib/api/types'
import type { Role, TenantId } from '@/lib/types'

export interface MockUser extends User {
  tenantId: TenantId
}

export interface MockTerm extends Term {
  tenantId: TenantId
}

export interface MockCourse extends Course {
  tenantId: TenantId
}

export interface MockSection extends Section {
  tenantId: TenantId
  courseId: string
}

export interface MockEnrollment extends Enrollment {
  tenantId: TenantId
  courseId: string
}

export interface MockModule extends Module {
  tenantId: TenantId
  courseId: string
}

export interface MockNotification extends Notification {
  tenantId: TenantId
  userId: string
}

export interface MockPreference {
  tenantId: TenantId
  userId: string
  preferences: Preferences
}

export interface MockAssignment extends Assignment {
  tenantId: TenantId
}

export interface MockSubmission extends Submission {
  tenantId: TenantId
  courseId: string
}

export interface MockGradeItem extends GradeItem {
  tenantId: TenantId
}

export interface MockGrade extends Grade {
  tenantId: TenantId
  courseId: string
}

export interface MockGradeHistory extends GradeHistoryEntry {
  tenantId: TenantId
  gradeId: string
}

export type MockFileStatus = 'PENDING_UPLOAD' | 'PENDING_SCAN' | 'CLEAN' | 'INFECTED'

export interface MockFile {
  tenantId: TenantId
  fileId: string
  courseId: string
  purpose: FilePurpose
  fileName: string
  contentType: string
  sizeBytes: number
  status: MockFileStatus
  ownerId: string
  createdAt: string
}

export interface MockDb {
  users: MockUser[]
  terms: MockTerm[]
  courses: MockCourse[]
  sections: MockSection[]
  enrollments: MockEnrollment[]
  modules: MockModule[]
  notifications: MockNotification[]
  preferences: MockPreference[]
  assignments: MockAssignment[]
  submissions: MockSubmission[]
  gradeItems: MockGradeItem[]
  grades: MockGrade[]
  gradeHistory: MockGradeHistory[]
  files: MockFile[]
}

export interface AuthContext {
  tenantId: TenantId
  role: Role
  userId: string
  token: string
}
