import type {
  Assignment,
  Course,
  Enrollment,
  Grade,
  GradeItem,
  Module,
  ModuleItem,
  Notification,
  Section,
  Submission,
  Term,
  User,
} from '@/lib/api/types'
import type {
  MockAssignment,
  MockCourse,
  MockEnrollment,
  MockGrade,
  MockGradeItem,
  MockModule,
  MockNotification,
  MockSection,
  MockSubmission,
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

export function toAssignment(assignment: MockAssignment): Assignment {
  return {
    assignmentId: assignment.assignmentId,
    courseId: assignment.courseId,
    title: assignment.title,
    instructions: assignment.instructions,
    dueAt: assignment.dueAt,
    maxScore: assignment.maxScore,
    allowLate: assignment.allowLate,
    status: assignment.status,
  }
}

/** Si `hideGrade`, no expone la nota (el alumno solo la ve cuando se publica). */
export function toSubmission(submission: MockSubmission, hideGrade = false): Submission {
  return {
    submissionId: submission.submissionId,
    assignmentId: submission.assignmentId,
    studentId: submission.studentId,
    attempt: submission.attempt,
    fileIds: [...submission.fileIds],
    comment: submission.comment,
    late: submission.late,
    status: hideGrade ? 'SUBMITTED' : submission.status,
    score: hideGrade ? null : (submission.score ?? null),
    feedback: hideGrade ? null : (submission.feedback ?? null),
    submittedAt: submission.submittedAt,
  }
}

export function toGradeItem(item: MockGradeItem): GradeItem {
  return {
    gradeItemId: item.gradeItemId,
    courseId: item.courseId,
    title: item.title,
    maxScore: item.maxScore,
    assignmentId: item.assignmentId,
  }
}

export function toGrade(grade: MockGrade): Grade {
  return {
    gradeId: grade.gradeId,
    gradeItemId: grade.gradeItemId,
    studentId: grade.studentId,
    score: grade.score,
    maxScore: grade.maxScore,
    status: grade.status,
    postedAt: grade.postedAt ?? null,
    title: grade.title,
    assignmentId: grade.assignmentId,
  }
}
