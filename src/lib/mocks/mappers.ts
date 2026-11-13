import type {
  Course,
  Enrollment,
  Module,
  ModuleItem,
  Notification,
  Section,
  Term,
  User,
} from '@/lib/api/types'
import type {
  MockCourse,
  MockEnrollment,
  MockModule,
  MockNotification,
  MockSection,
  MockTerm,
  MockUser,
} from './types'

export function toCourse(course: MockCourse): Course {
  return {
    courseId: course.courseId,
    termId: course.termId,
    code: course.code,
    title: course.title,
    description: course.description,
    status: course.status,
    ownerId: course.ownerId,
    createdAt: course.createdAt,
  }
}

export function toSection(section: MockSection): Section {
  return {
    sectionId: section.sectionId,
    name: section.name,
  }
}

export function toEnrollment(enrollment: MockEnrollment): Enrollment {
  return {
    enrollmentId: enrollment.enrollmentId,
    userId: enrollment.userId,
    role: enrollment.role,
    sectionId: enrollment.sectionId,
    createdAt: enrollment.createdAt,
  }
}

export function toTerm(term: MockTerm): Term {
  return {
    termId: term.termId,
    name: term.name,
    startsOn: term.startsOn,
    endsOn: term.endsOn,
    status: term.status,
  }
}

export function toUser(user: MockUser): User {
  return {
    userId: user.userId,
    role: user.role,
    institutionalCode: user.institutionalCode,
    givenName: user.givenName,
    familyName: user.familyName,
    email: user.email,
    locale: user.locale,
    timeZone: user.timeZone,
    createdAt: user.createdAt,
  }
}

export function toModuleItem(item: ModuleItem): ModuleItem {
  return {
    itemId: item.itemId,
    type: item.type,
    title: item.title,
    position: item.position,
    body: item.body,
    fileId: item.fileId,
    url: item.url,
  }
}

export function toModule(module: MockModule): Module {
  return {
    moduleId: module.moduleId,
    title: module.title,
    position: module.position,
    status: module.status,
    items: module.items.map(toModuleItem),
  }
}

export function toNotification(notification: MockNotification): Notification {
  return {
    notificationId: notification.notificationId,
    type: notification.type,
    title: notification.title,
    courseId: notification.courseId,
    status: notification.status,
    createdAt: notification.createdAt,
  }
}
