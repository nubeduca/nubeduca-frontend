import type {
  Course,
  Enrollment,
  Module,
  Notification,
  Preferences,
  Section,
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

export interface MockDb {
  users: MockUser[]
  terms: MockTerm[]
  courses: MockCourse[]
  sections: MockSection[]
  enrollments: MockEnrollment[]
  modules: MockModule[]
  notifications: MockNotification[]
  preferences: MockPreference[]
}

export interface AuthContext {
  tenantId: TenantId
  role: Role
  userId: string
  token: string
}
