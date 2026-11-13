import { http, HttpResponse } from 'msw'
import { mockState } from '../db'
import { toAssignment, toSubmission } from '../mappers'
import type { MockAssignment, MockGrade, MockSubmission } from '../types'
import type { AuthContext } from '../types'
import { canSeeCourse, findCourse, isCourseTeacher } from './course-access'
import { enrolledStudents, notify, nowIso } from './notify'
import {
  badRequest,
  conflict,
  forbidden,
  getAuth,
  isNonEmptyString,
  nextId,
  notFound,
  paginate,
  readJson,
  unauthorized,
} from './utils'

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function findAssignment(
  auth: AuthContext,
  assignmentId: string,
): MockAssignment | undefined {
  return mockState.db.assignments.find(
    (item) => item.tenantId === auth.tenantId && item.assignmentId === assignmentId,
  )
}

/** El alumno ve la nota de su entrega solo cuando la nota del libro está publicada. */
function gradeIsPosted(submission: MockSubmission): boolean {
  const gradeItem = mockState.db.gradeItems.find(
    (item) => item.assignmentId === submission.assignmentId,
  )
  return mockState.db.grades.some(
    (grade) =>
      grade.gradeItemId === gradeItem?.gradeItemId &&
      grade.studentId === submission.studentId &&
      grade.status === 'POSTED',
  )
}

function submissionFor(auth: AuthContext, submission: MockSubmission) {
  return toSubmission(submission, auth.role === 'STUDENT' && !gradeIsPosted(submission))
}

/**
 * Resolución de un assignment visible para el usuario, con la regla de cada rol:
 * el alumno solo ve tareas publicadas de cursos donde está matriculado.
 */
function visibleAssignment(
  auth: AuthContext,
  assignmentId: string,
): { assignment: MockAssignment; teacher: boolean } | Response {
  const assignment = findAssignment(auth, assignmentId)
  const course = assignment ? findCourse(auth, assignment.courseId) : undefined
  if (!assignment || !course) {
    return notFound('TAREA_NO_ENCONTRADA', 'No existe la tarea.')
  }
  if (!canSeeCourse(auth, course)) {
    return forbidden()
  }
  if (auth.role === 'STUDENT' && assignment.status !== 'PUBLISHED') {
    return notFound('TAREA_NO_ENCONTRADA', 'No existe la tarea.')
  }
  return { assignment, teacher: isCourseTeacher(auth, course) }
}

export const evaluacionHandlers = [
  http.get(
    '/mock-api/evaluaciones/courses/:courseId/assignments',
    ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canSeeCourse(auth, course)) {
        return forbidden()
      }

      const assignments = mockState.db.assignments
        .filter(
          (item) =>
            item.tenantId === auth.tenantId &&
            item.courseId === course.courseId &&
            (auth.role !== 'STUDENT' || item.status === 'PUBLISHED'),
        )
        .sort((left, right) => left.dueAt.localeCompare(right.dueAt))

      const page = paginate(assignments, request)
      if (!page) {
        return badRequest('El token de paginación no es válido.')
      }
      return HttpResponse.json({
        items: page.items.map(toAssignment),
        nextToken: page.nextToken,
      })
    },
  ),

  http.post(
    '/mock-api/evaluaciones/courses/:courseId/assignments',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!isCourseTeacher(auth, course)) {
        return forbidden()
      }

      const body = await readJson(request)
      if (
        !body ||
        !isNonEmptyString(body.title) ||
        body.title.length > 200 ||
        !isValidDate(body.dueAt) ||
        typeof body.maxScore !== 'number' ||
        body.maxScore <= 0 ||
        (body.instructions !== undefined && typeof body.instructions !== 'string') ||
        (body.allowLate !== undefined && typeof body.allowLate !== 'boolean')
      ) {
        return badRequest()
      }

      const assignment: MockAssignment = {
        tenantId: auth.tenantId,
        assignmentId: nextId('asg'),
        courseId: course.courseId,
        title: body.title.trim(),
        instructions:
          typeof body.instructions === 'string' ? body.instructions : undefined,
        dueAt: body.dueAt,
        maxScore: body.maxScore,
        allowLate: body.allowLate === true,
        status: 'DRAFT',
      }
      mockState.db.assignments.push(assignment)
      return HttpResponse.json(toAssignment(assignment), { status: 201 })
    },
  ),

  http.get('/mock-api/evaluaciones/assignments/:assignmentId', ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }
    const result = visibleAssignment(auth, String(params.assignmentId))
    if (result instanceof Response) {
      return result
    }
    return HttpResponse.json(toAssignment(result.assignment))
  }),

  http.patch(
    '/mock-api/evaluaciones/assignments/:assignmentId',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      const result = visibleAssignment(auth, String(params.assignmentId))
      if (result instanceof Response) {
        return result
      }
      if (!result.teacher) {
        return forbidden()
      }

      const body = await readJson(request)
      if (
        !body ||
        (body.title !== undefined &&
          (!isNonEmptyString(body.title) || body.title.length > 200)) ||
        (body.dueAt !== undefined && !isValidDate(body.dueAt)) ||
        (body.instructions !== undefined && typeof body.instructions !== 'string') ||
        (body.allowLate !== undefined && typeof body.allowLate !== 'boolean')
      ) {
        return badRequest()
      }

      const { assignment } = result
      if (typeof body.title === 'string') {
        assignment.title = body.title.trim()
      }
      if (typeof body.instructions === 'string') {
        assignment.instructions = body.instructions
      }
      if (typeof body.dueAt === 'string') {
        assignment.dueAt = body.dueAt
      }
      if (typeof body.allowLate === 'boolean') {
        assignment.allowLate = body.allowLate
      }
      return HttpResponse.json(toAssignment(assignment))
    },
  ),

  http.post(
    '/mock-api/evaluaciones/assignments/:assignmentId/publish',
    ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      const result = visibleAssignment(auth, String(params.assignmentId))
      if (result instanceof Response) {
        return result
      }
      if (!result.teacher) {
        return forbidden()
      }
      const { assignment } = result
      if (assignment.status === 'PUBLISHED') {
        return conflict('TAREA_YA_PUBLICADA', 'La tarea ya está publicada.')
      }

      assignment.status = 'PUBLISHED'
      // Reacciones a assignment.published: ms-calificaciones crea la columna y
      // ms-notificaciones avisa a los matriculados.
      mockState.db.gradeItems.push({
        tenantId: auth.tenantId,
        gradeItemId: nextId('gri'),
        courseId: assignment.courseId,
        title: assignment.title,
        maxScore: assignment.maxScore,
        assignmentId: assignment.assignmentId,
      })
      notify(
        auth.tenantId,
        enrolledStudents(assignment.courseId),
        'ASSIGNMENT',
        `Nueva tarea: ${assignment.title}`,
        assignment.courseId,
      )
      return HttpResponse.json(toAssignment(assignment))
    },
  ),

  http.get(
    '/mock-api/evaluaciones/assignments/:assignmentId/submissions',
    ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      if (auth.role !== 'STUDENT' && auth.role !== 'TEACHER') {
        return forbidden()
      }
      const result = visibleAssignment(auth, String(params.assignmentId))
      if (result instanceof Response) {
        return result
      }
      if (auth.role === 'TEACHER' && !result.teacher) {
        return forbidden()
      }

      const submissions = mockState.db.submissions
        .filter(
          (item) =>
            item.tenantId === auth.tenantId &&
            item.assignmentId === result.assignment.assignmentId &&
            (auth.role === 'TEACHER' || item.studentId === auth.userId),
        )
        .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))

      const page = paginate(submissions, request)
      if (!page) {
        return badRequest('El token de paginación no es válido.')
      }
      return HttpResponse.json({
        items: page.items.map((item) => submissionFor(auth, item)),
        nextToken: page.nextToken,
      })
    },
  ),

  http.post(
    '/mock-api/evaluaciones/assignments/:assignmentId/submissions',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      if (auth.role !== 'STUDENT') {
        return forbidden()
      }
      const result = visibleAssignment(auth, String(params.assignmentId))
      if (result instanceof Response) {
        return result
      }
      const { assignment } = result

      const body = await readJson(request)
      const fileIds = body?.fileIds
      if (
        !body ||
        !Array.isArray(fileIds) ||
        fileIds.length < 1 ||
        fileIds.length > 10 ||
        new Set(fileIds).size !== fileIds.length ||
        !fileIds.every(isNonEmptyString) ||
        (body.comment !== undefined &&
          (typeof body.comment !== 'string' || body.comment.length > 2000))
      ) {
        return badRequest('Adjunta entre 1 y 10 archivos.')
      }

      const filesOk = fileIds.every((fileId) =>
        mockState.db.files.some(
          (file) =>
            file.tenantId === auth.tenantId &&
            file.fileId === fileId &&
            file.ownerId === auth.userId &&
            file.courseId === assignment.courseId &&
            file.purpose === 'SUBMISSION' &&
            file.status === 'CLEAN',
        ),
      )
      if (!filesOk) {
        return badRequest(
          'Algún archivo no existe, no es tuyo o todavía no fue revisado.',
        )
      }

      const late = Date.now() > Date.parse(assignment.dueAt)
      if (late && !assignment.allowLate) {
        return conflict(
          'PLAZO_VENCIDO',
          'La fecha límite ya pasó y la tarea no acepta entregas tardías.',
        )
      }

      const previous = mockState.db.submissions.filter(
        (item) =>
          item.assignmentId === assignment.assignmentId && item.studentId === auth.userId,
      )
      const submission: MockSubmission = {
        tenantId: auth.tenantId,
        courseId: assignment.courseId,
        submissionId: nextId('sbm'),
        assignmentId: assignment.assignmentId,
        studentId: auth.userId,
        attempt: previous.length + 1,
        fileIds: [...fileIds],
        comment:
          typeof body.comment === 'string' && body.comment.trim()
            ? body.comment
            : undefined,
        late,
        status: 'SUBMITTED',
        score: null,
        feedback: null,
        submittedAt: nowIso(),
      }
      mockState.db.submissions.push(submission)
      notify(
        auth.tenantId,
        [auth.userId],
        'SUBMISSION_RECEIPT',
        `Recibimos tu entrega de ${assignment.title} (intento ${submission.attempt})`,
        assignment.courseId,
      )
      return HttpResponse.json(submissionFor(auth, submission), { status: 201 })
    },
  ),

  http.get('/mock-api/evaluaciones/submissions/:submissionId', ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }
    const submission = mockState.db.submissions.find(
      (item) =>
        item.tenantId === auth.tenantId &&
        item.submissionId === String(params.submissionId),
    )
    if (!submission) {
      return notFound('ENTREGA_NO_ENCONTRADA', 'No existe la entrega.')
    }
    const course = findCourse(auth, submission.courseId)
    const allowed =
      submission.studentId === auth.userId ||
      Boolean(course && isCourseTeacher(auth, course))
    if (!allowed) {
      return forbidden()
    }
    return HttpResponse.json(submissionFor(auth, submission))
  }),

  http.post(
    '/mock-api/evaluaciones/submissions/:submissionId/grade',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      const submission = mockState.db.submissions.find(
        (item) =>
          item.tenantId === auth.tenantId &&
          item.submissionId === String(params.submissionId),
      )
      if (!submission) {
        return notFound('ENTREGA_NO_ENCONTRADA', 'No existe la entrega.')
      }
      const course = findCourse(auth, submission.courseId)
      const assignment = findAssignment(auth, submission.assignmentId)
      if (!course || !assignment || !isCourseTeacher(auth, course)) {
        return forbidden()
      }

      const body = await readJson(request)
      if (
        !body ||
        typeof body.score !== 'number' ||
        body.score < 0 ||
        (body.feedback !== undefined &&
          (typeof body.feedback !== 'string' || body.feedback.length > 5000))
      ) {
        return badRequest()
      }
      if (body.score > assignment.maxScore) {
        return badRequest(`La nota no puede pasar de ${assignment.maxScore}.`)
      }

      submission.status = 'GRADED'
      submission.score = body.score
      submission.feedback = typeof body.feedback === 'string' ? body.feedback : null

      // Reacción a submission.graded en ms-calificaciones: nota en DRAFT + auditoría.
      const gradeItem = mockState.db.gradeItems.find(
        (item) => item.assignmentId === assignment.assignmentId,
      )
      if (gradeItem) {
        let grade = mockState.db.grades.find(
          (item) =>
            item.gradeItemId === gradeItem.gradeItemId &&
            item.studentId === submission.studentId,
        )
        const previousScore = grade?.score ?? null
        if (!grade) {
          grade = {
            tenantId: auth.tenantId,
            courseId: course.courseId,
            gradeId: nextId('grd'),
            gradeItemId: gradeItem.gradeItemId,
            studentId: submission.studentId,
            score: body.score,
            maxScore: gradeItem.maxScore,
            status: 'DRAFT',
            postedAt: null,
            title: gradeItem.title,
            assignmentId: assignment.assignmentId,
          } satisfies MockGrade
          mockState.db.grades.push(grade)
        } else {
          grade.score = body.score
          if (grade.status === 'POSTED') {
            notify(
              auth.tenantId,
              [grade.studentId],
              'GRADE',
              `Se actualizó tu nota de ${gradeItem.title}`,
              course.courseId,
            )
          }
        }
        mockState.db.gradeHistory.push({
          tenantId: auth.tenantId,
          gradeId: grade.gradeId,
          previousScore,
          score: body.score,
          cause: 'GRADED',
          reason: null,
          changedBy: auth.userId,
          changedAt: nowIso(),
        })
      }

      return HttpResponse.json(submissionFor(auth, submission))
    },
  ),
]
