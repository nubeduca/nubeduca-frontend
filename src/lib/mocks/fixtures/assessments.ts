import { DEMO_USER_IDS } from '@/lib/demo-users'
import type {
  MockAssignment,
  MockCourse,
  MockEnrollment,
  MockFile,
  MockGrade,
  MockGradeHistory,
  MockGradeItem,
  MockSubmission,
} from '../types'
import { mockId } from './ids'

const DAY = 24 * 60 * 60 * 1000

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

interface AssignmentSeed {
  title: string
  instructions: string
  dueInDays: number
  maxScore: number
  allowLate: boolean
  published: boolean
}

const ASSIGNMENTS: AssignmentSeed[] = [
  {
    title: 'Laboratorio 1 · Despliegue serverless',
    instructions:
      'Despliega una API con API Gateway + Lambda usando Serverless Framework. Sube el informe en PDF con capturas.',
    dueInDays: -3,
    maxScore: 20,
    allowLate: false,
    published: true,
  },
  {
    title: 'Laboratorio 2 · Eventos con EventBridge',
    instructions:
      'Publica un evento en el bus lms y consúmelo desde una cola SQS con DLQ. Adjunta el código y un video corto.',
    dueInDays: 7,
    maxScore: 20,
    allowLate: true,
    published: true,
  },
  {
    title: 'Proyecto final · LMS multi-tenant',
    instructions: 'Entrega del proyecto final del curso.',
    dueInDays: 30,
    maxScore: 20,
    allowLate: false,
    published: false,
  },
]

export interface AssessmentSeed {
  assignments: MockAssignment[]
  submissions: MockSubmission[]
  gradeItems: MockGradeItem[]
  grades: MockGrade[]
  gradeHistory: MockGradeHistory[]
  files: MockFile[]
}

/**
 * Tareas del curso publicado de cada tenant (Cloud Computing):
 * Lab 1 vencido con entregas (una nota publicada, una en borrador y una sin calificar),
 * Lab 2 abierto y el proyecto final en borrador.
 */
export function seedAssessments(
  courses: MockCourse[],
  enrollments: MockEnrollment[],
): AssessmentSeed {
  const seed: AssessmentSeed = {
    assignments: [],
    submissions: [],
    gradeItems: [],
    grades: [],
    gradeHistory: [],
    files: [],
  }
  let seq = 1
  const next = (prefix: string) => mockId(prefix, 20000 + seq++)

  courses
    .filter((course) => course.status === 'PUBLISHED')
    .forEach((course) => {
      const tenantId = course.tenantId
      const teacherId = DEMO_USER_IDS[tenantId].TEACHER
      const students = enrollments
        .filter((item) => item.courseId === course.courseId && item.role === 'STUDENT')
        .map((item) => item.userId)

      ASSIGNMENTS.forEach((definition, index) => {
        const assignment: MockAssignment = {
          tenantId,
          assignmentId: next('asg'),
          courseId: course.courseId,
          title: definition.title,
          instructions: definition.instructions,
          dueAt: daysFromNow(definition.dueInDays),
          maxScore: definition.maxScore,
          allowLate: definition.allowLate,
          status: definition.published ? 'PUBLISHED' : 'DRAFT',
        }
        seed.assignments.push(assignment)

        if (!definition.published) {
          return
        }

        const gradeItem: MockGradeItem = {
          tenantId,
          gradeItemId: next('gri'),
          courseId: course.courseId,
          title: assignment.title,
          maxScore: assignment.maxScore,
          assignmentId: assignment.assignmentId,
        }
        seed.gradeItems.push(gradeItem)

        if (index !== 0) {
          return
        }

        // Lab 1: [score, posted] por alumno; null = entregó pero falta calificar.
        const outcomes: Array<[number, boolean] | null> = [[17, true], null, [14, false]]
        students.slice(0, outcomes.length).forEach((studentId, studentIndex) => {
          const outcome = outcomes[studentIndex] ?? null
          const file: MockFile = {
            tenantId,
            fileId: next('fil'),
            courseId: course.courseId,
            purpose: 'SUBMISSION',
            fileName: `lab1-informe-${studentIndex + 1}.pdf`,
            contentType: 'application/pdf',
            sizeBytes: 245_000 + studentIndex * 1000,
            status: 'CLEAN',
            ownerId: studentId,
            createdAt: daysFromNow(-4),
          }
          seed.files.push(file)

          seed.submissions.push({
            tenantId,
            courseId: course.courseId,
            submissionId: next('sbm'),
            assignmentId: assignment.assignmentId,
            studentId,
            attempt: 1,
            fileIds: [file.fileId],
            comment:
              studentIndex === 0 ? 'Adjunto el informe con las capturas.' : undefined,
            late: false,
            status: outcome ? 'GRADED' : 'SUBMITTED',
            score: outcome ? outcome[0] : null,
            feedback: outcome
              ? 'Despliegue: 8/8\nDocumentación: 5/6\nBuenas prácticas: 4/6\n\nBuen trabajo, revisa los permisos de IAM.'
              : null,
            submittedAt: daysFromNow(-4),
          })

          if (!outcome) {
            return
          }

          const gradeId = next('grd')
          seed.grades.push({
            tenantId,
            courseId: course.courseId,
            gradeId,
            gradeItemId: gradeItem.gradeItemId,
            studentId,
            score: outcome[0],
            maxScore: gradeItem.maxScore,
            status: outcome[1] ? 'POSTED' : 'DRAFT',
            postedAt: outcome[1] ? daysFromNow(-1) : null,
            title: gradeItem.title,
            assignmentId: assignment.assignmentId,
          })
          seed.gradeHistory.push({
            tenantId,
            gradeId,
            previousScore: null,
            score: outcome[0],
            cause: 'GRADED',
            reason: null,
            changedBy: teacherId,
            changedAt: daysFromNow(-2),
          })
        })
      })
    })

  return seed
}
