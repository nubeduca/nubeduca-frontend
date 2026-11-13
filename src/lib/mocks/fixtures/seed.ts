import { DEMO_USER_IDS } from '@/lib/demo-users'
import { TENANTS } from '@/lib/types'
import type {
  CourseStatus,
  ModuleItemInput,
  ModuleStatus,
  NotificationType,
  Preferences,
} from '@/lib/api/types'
import type {
  MockCourse,
  MockDb,
  MockEnrollment,
  MockModule,
  MockNotification,
  MockPreference,
  MockSection,
} from '../types'
import { seedAssessments } from './assessments'
import { mockId } from './ids'
import { TERMS } from './terms'
import { USERS } from './users'

const CREATED_AT = '2026-11-10T15:00:00Z'
const BASE_TIME = Date.UTC(2026, 10, 10, 15, 0, 0)

const COURSE_DEFINITIONS: Array<{
  code: string
  title: string
  description: string
  status: CourseStatus
}> = [
  {
    code: 'CS2032',
    title: 'Cloud Computing',
    description:
      'Fundamentos de computación en la nube, despliegue de aplicaciones y arquitecturas serverless.',
    status: 'PUBLISHED',
  },
  {
    code: 'CS2033',
    title: 'Arquitectura de Software',
    description:
      'Diseño de sistemas distribuidos, patrones arquitectónicos y evolución de microservicios.',
    status: 'DRAFT',
  },
  {
    code: 'CS2034',
    title: 'Base de Datos Avanzada',
    description:
      'Modelado NoSQL, transacciones distribuidas y optimización de consultas a gran escala.',
    status: 'ARCHIVED',
  },
]

interface ModuleDefinition {
  title: string
  position: number
  status: ModuleStatus
  items: ModuleItemInput[]
}

const MODULE_DEFINITIONS: ModuleDefinition[][] = [
  [
    {
      title: 'Fundamentos de la nube',
      position: 1,
      status: 'PUBLISHED',
      items: [
        {
          type: 'PAGE',
          title: 'Bienvenida al curso',
          body: 'En este módulo revisaremos los conceptos base de la computación en la nube.',
        },
        {
          type: 'LINK',
          title: 'Documentación de AWS',
          url: 'https://docs.aws.amazon.com/',
        },
      ],
    },
    {
      title: 'Laboratorio 1',
      position: 2,
      status: 'DRAFT',
      items: [
        {
          type: 'PAGE',
          title: 'Guía del laboratorio',
          body: 'Sigue los pasos para desplegar tu primera función Lambda.',
        },
      ],
    },
  ],
  [
    {
      title: 'Introducción a la arquitectura',
      position: 1,
      status: 'DRAFT',
      items: [
        {
          type: 'PAGE',
          title: 'Lectura inicial',
          body: 'Revisaremos los estilos arquitectónicos más usados en la industria.',
        },
      ],
    },
  ],
  [
    {
      title: 'Modelado NoSQL',
      position: 1,
      status: 'PUBLISHED',
      items: [
        {
          type: 'LINK',
          title: 'Guía de DynamoDB',
          url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/',
        },
      ],
    },
  ],
]

function hoursAgo(hours: number): string {
  return new Date(BASE_TIME - hours * 3_600_000).toISOString()
}

function defaultPreferences(): Preferences {
  return {
    email: {
      coursePublished: true,
      announcements: true,
      modules: true,
      assignments: true,
      submissionReceipts: true,
      grades: true,
    },
  }
}

interface NotificationSeed {
  type: NotificationType
  title: string
  courseId?: string
  status: MockNotification['status']
  createdAt: string
}

export function seedDb(): MockDb {
  const courses: MockCourse[] = []
  const sections: MockSection[] = []
  const enrollments: MockEnrollment[] = []
  const modules: MockModule[] = []
  const notifications: MockNotification[] = []
  const preferences: MockPreference[] = []

  let enrollmentSeq = 1
  let itemSeq = 1

  TENANTS.forEach((tenant, tenantIndex) => {
    const term = TERMS.find(
      (item) => item.tenantId === tenant.id && item.status === 'ACTIVE',
    )
    if (!term) {
      return
    }

    const teacherId = DEMO_USER_IDS[tenant.id].TEACHER
    const studentId = DEMO_USER_IDS[tenant.id].STUDENT
    const adminId = DEMO_USER_IDS[tenant.id].ADMIN
    const extraStudentIds = USERS.filter(
      (user) =>
        user.tenantId === tenant.id &&
        user.role === 'STUDENT' &&
        user.userId !== studentId,
    ).map((user) => user.userId)

    const tenantCourses = COURSE_DEFINITIONS.map((definition, courseIndex) => {
      const course: MockCourse = {
        tenantId: tenant.id,
        courseId: mockId('crs', 1000 + tenantIndex * 10 + courseIndex),
        termId: term.termId,
        code: definition.code,
        title: definition.title,
        description: definition.description,
        status: definition.status,
        ownerId: teacherId,
        createdAt: CREATED_AT,
      }
      courses.push(course)
      return course
    })

    const sectionsByCourse = new Map<string, MockSection[]>()

    tenantCourses.forEach((course, courseIndex) => {
      const courseSections = [0, 1].map((sectionIndex) => {
        const section: MockSection = {
          tenantId: tenant.id,
          courseId: course.courseId,
          sectionId: mockId(
            'sec',
            5000 + tenantIndex * 100 + courseIndex * 10 + sectionIndex,
          ),
          name: `Sección ${sectionIndex + 1}`,
        }
        sections.push(section)
        return section
      })
      sectionsByCourse.set(course.courseId, courseSections)

      const definitions = MODULE_DEFINITIONS[courseIndex] ?? []
      definitions.forEach((definition, moduleIndex) => {
        const items = definition.items.map((item, itemIndex) => {
          const moduleItem = {
            ...item,
            itemId: mockId('itm', 9000 + itemSeq),
            position: itemIndex + 1,
          }
          itemSeq += 1
          return moduleItem
        })

        modules.push({
          tenantId: tenant.id,
          courseId: course.courseId,
          moduleId: mockId(
            'mod',
            7000 + tenantIndex * 100 + courseIndex * 10 + moduleIndex,
          ),
          title: definition.title,
          position: definition.position,
          status: definition.status,
          items,
        })
      })
    })

    const addEnrollment = (
      course: MockCourse,
      userId: string,
      role: 'STUDENT' | 'TEACHER',
      sectionId?: string,
    ) => {
      enrollments.push({
        tenantId: tenant.id,
        courseId: course.courseId,
        enrollmentId: mockId('enr', 3000 + enrollmentSeq),
        userId,
        role,
        sectionId,
        createdAt: CREATED_AT,
      })
      enrollmentSeq += 1
    }

    const published = tenantCourses[0]
    const draft = tenantCourses[1]
    const archived = tenantCourses[2]
    if (!published || !draft || !archived) {
      return
    }

    const publishedSections = sectionsByCourse.get(published.courseId) ?? []
    const draftSections = sectionsByCourse.get(draft.courseId) ?? []

    addEnrollment(published, teacherId, 'TEACHER', publishedSections[0]?.sectionId)
    addEnrollment(draft, teacherId, 'TEACHER', draftSections[0]?.sectionId)
    addEnrollment(published, studentId, 'STUDENT', publishedSections[0]?.sectionId)
    addEnrollment(draft, studentId, 'STUDENT', draftSections[0]?.sectionId)

    const firstExtra = extraStudentIds[0]
    const secondExtra = extraStudentIds[1]
    const thirdExtra = extraStudentIds[2]
    const fourthExtra = extraStudentIds[3]

    if (firstExtra) {
      addEnrollment(published, firstExtra, 'STUDENT', publishedSections[0]?.sectionId)
    }
    if (secondExtra) {
      addEnrollment(published, secondExtra, 'STUDENT', publishedSections[1]?.sectionId)
    }
    if (thirdExtra) {
      addEnrollment(draft, thirdExtra, 'STUDENT', draftSections[1]?.sectionId)
    }
    if (fourthExtra) {
      addEnrollment(published, fourthExtra, 'STUDENT', publishedSections[1]?.sectionId)
    }

    const publishedNotifications: NotificationSeed[] = [
      {
        type: 'COURSE_PUBLISHED',
        title: 'Se publicó el curso Cloud Computing',
        courseId: published.courseId,
        status: 'SENT',
        createdAt: hoursAgo(1),
      },
      {
        type: 'MODULE',
        title: 'Nuevo módulo: Fundamentos de la nube',
        courseId: published.courseId,
        status: 'SENT',
        createdAt: hoursAgo(2),
      },
      {
        type: 'ANNOUNCEMENT',
        title: 'Aviso del curso: primera sesión',
        courseId: published.courseId,
        status: 'SKIPPED_BY_PREFERENCE',
        createdAt: hoursAgo(3),
      },
      {
        type: 'GRADE',
        title: 'Nota publicada en Laboratorio 1',
        courseId: published.courseId,
        status: 'SENT',
        createdAt: hoursAgo(4),
      },
    ]

    const teacherNotifications: NotificationSeed[] = [
      {
        type: 'ASSIGNMENT',
        title: 'Nueva entrega de Laboratorio 1',
        courseId: published.courseId,
        status: 'SENT',
        createdAt: hoursAgo(1),
      },
      {
        type: 'COURSE_PUBLISHED',
        title: 'Tu curso Arquitectura de Software quedó en borrador',
        courseId: draft.courseId,
        status: 'FAILED',
        createdAt: hoursAgo(5),
      },
    ]

    const adminNotifications: NotificationSeed[] = [
      {
        type: 'COURSE_PUBLISHED',
        title: 'Se publicó un curso en el tenant',
        courseId: published.courseId,
        status: 'SENT',
        createdAt: hoursAgo(2),
      },
    ]

    const notificationTargets: Array<{
      userId: string
      seeds: NotificationSeed[]
      userIndex: number
    }> = [
      { userId: studentId, seeds: publishedNotifications, userIndex: 0 },
      { userId: teacherId, seeds: teacherNotifications, userIndex: 1 },
      { userId: adminId, seeds: adminNotifications, userIndex: 2 },
    ]

    notificationTargets.forEach((target) => {
      target.seeds.forEach((seed, notificationIndex) => {
        notifications.push({
          tenantId: tenant.id,
          userId: target.userId,
          notificationId: mockId(
            'ntf',
            11000 + tenantIndex * 100 + target.userIndex * 10 + notificationIndex,
          ),
          ...seed,
        })
      })
    })

    USERS.filter((user) => user.tenantId === tenant.id).forEach((user) => {
      preferences.push({
        tenantId: tenant.id,
        userId: user.userId,
        preferences: defaultPreferences(),
      })
    })

    const studentPreferences = preferences.find(
      (item) => item.tenantId === tenant.id && item.userId === studentId,
    )
    if (studentPreferences) {
      studentPreferences.preferences.email.announcements = false
    }
  })

  return {
    ...seedAssessments(courses, enrollments),
    users: USERS.map((user) => ({ ...user })),
    terms: TERMS.map((term) => ({ ...term })),
    courses,
    sections,
    enrollments,
    modules,
    notifications,
    preferences,
  }
}
