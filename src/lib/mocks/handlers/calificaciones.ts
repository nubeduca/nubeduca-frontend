import { http, HttpResponse } from 'msw'
import { mockState } from '../db'
import { toGrade, toGradeItem } from '../mappers'
import type { AuthContext, MockGrade } from '../types'
import { canSeeCourse, findCourse, isCourseTeacher } from './course-access'
import { enrolledStudents, notify, nowIso } from './notify'
import { badRequest, forbidden, getAuth, notFound, readJson, unauthorized } from './utils'

function findGrade(auth: AuthContext, gradeId: string): MockGrade | undefined {
  return mockState.db.grades.find(
    (item) => item.tenantId === auth.tenantId && item.gradeId === gradeId,
  )
}

function teachesCourseOf(auth: AuthContext, courseId: string): boolean {
  const course = findCourse(auth, courseId)
  return Boolean(course && isCourseTeacher(auth, course))
}

export const calificacionHandlers = [
  http.get(
    '/mock-api/calificaciones/courses/:courseId/gradebook',
    ({ request, params }) => {
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

      const gradeItems = mockState.db.gradeItems.filter(
        (item) => item.tenantId === auth.tenantId && item.courseId === course.courseId,
      )
      const itemIds = new Set(gradeItems.map((item) => item.gradeItemId))
      const rows = enrolledStudents(course.courseId).map((studentId) => ({
        studentId,
        grades: mockState.db.grades
          .filter(
            (grade) => itemIds.has(grade.gradeItemId) && grade.studentId === studentId,
          )
          .map(toGrade),
      }))

      return HttpResponse.json({ gradeItems: gradeItems.map(toGradeItem), rows })
    },
  ),

  http.get(
    '/mock-api/calificaciones/courses/:courseId/grades/me',
    ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      if (auth.role !== 'STUDENT') {
        return forbidden()
      }
      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canSeeCourse(auth, course)) {
        return forbidden()
      }

      const items = mockState.db.grades
        .filter(
          (grade) =>
            grade.tenantId === auth.tenantId &&
            grade.courseId === course.courseId &&
            grade.studentId === auth.userId &&
            grade.status === 'POSTED',
        )
        .map(toGrade)
      return HttpResponse.json({ items })
    },
  ),

  http.post(
    '/mock-api/calificaciones/grade-items/:gradeItemId/post',
    ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      const gradeItem = mockState.db.gradeItems.find(
        (item) =>
          item.tenantId === auth.tenantId &&
          item.gradeItemId === String(params.gradeItemId),
      )
      if (!gradeItem) {
        return notFound('COLUMNA_NO_ENCONTRADA', 'No existe la columna de notas.')
      }
      if (!teachesCourseOf(auth, gradeItem.courseId)) {
        return forbidden()
      }

      const drafts = mockState.db.grades.filter(
        (grade) =>
          grade.gradeItemId === gradeItem.gradeItemId && grade.status === 'DRAFT',
      )
      const postedAt = nowIso()
      drafts.forEach((grade) => {
        grade.status = 'POSTED'
        grade.postedAt = postedAt
      })
      // grade.posted → ms-notificaciones (cola FIFO), un aviso por alumno.
      notify(
        auth.tenantId,
        drafts.map((grade) => grade.studentId),
        'GRADE',
        `Nota publicada en ${gradeItem.title}`,
        gradeItem.courseId,
      )

      return HttpResponse.json({ posted: drafts.length })
    },
  ),

  http.patch('/mock-api/calificaciones/grades/:gradeId', async ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }
    const grade = findGrade(auth, String(params.gradeId))
    if (!grade) {
      return notFound('NOTA_NO_ENCONTRADA', 'No existe la nota.')
    }
    if (!teachesCourseOf(auth, grade.courseId)) {
      return forbidden()
    }

    const body = await readJson(request)
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    if (!body || typeof body.score !== 'number' || body.score < 0) {
      return badRequest()
    }
    if (body.score > grade.maxScore) {
      return badRequest(`La nota no puede pasar de ${grade.maxScore}.`)
    }
    if (reason.length < 5 || reason.length > 500) {
      return badRequest('Explica el motivo del cambio (entre 5 y 500 caracteres).')
    }

    const previousScore = grade.score
    grade.score = body.score
    mockState.db.gradeHistory.push({
      tenantId: auth.tenantId,
      gradeId: grade.gradeId,
      previousScore,
      score: body.score,
      cause: 'MANUAL_OVERRIDE',
      reason,
      changedBy: auth.userId,
      changedAt: nowIso(),
    })
    if (grade.status === 'POSTED') {
      notify(
        auth.tenantId,
        [grade.studentId],
        'GRADE',
        `Se corrigió tu nota de ${grade.title ?? 'una evaluación'}`,
        grade.courseId,
      )
    }

    return HttpResponse.json(toGrade(grade))
  }),

  http.get('/mock-api/calificaciones/grades/:gradeId/history', ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }
    const grade = findGrade(auth, String(params.gradeId))
    if (!grade) {
      return notFound('NOTA_NO_ENCONTRADA', 'No existe la nota.')
    }
    if (auth.role !== 'ADMIN' && !teachesCourseOf(auth, grade.courseId)) {
      return forbidden()
    }

    const items = mockState.db.gradeHistory
      .filter((entry) => entry.gradeId === grade.gradeId)
      // Más reciente primero; a igual segundo, el último registrado va antes.
      .reverse()
      .sort((left, right) => right.changedAt.localeCompare(left.changedAt))
      .map(({ previousScore, score, cause, reason, changedBy, changedAt }) => ({
        previousScore,
        score,
        cause,
        reason: reason ?? null,
        changedBy,
        changedAt,
      }))
    return HttpResponse.json({ items })
  }),
]
