import { http, HttpResponse } from 'msw'
import type { CourseStatus, ImportError, ImportResult } from '@/lib/api/types'
import { mockState } from '../db'
import { toCourse, toEnrollment, toSection } from '../mappers'
import { nextId } from './utils'
import {
  badRequest,
  conflict,
  forbidden,
  getAuth,
  isNonEmptyString,
  notFound,
  paginate,
  readJson,
  unauthorized,
} from './utils'
import { canManageCourse, canSeeCourse, findCourse, isEnrolled } from './course-access'

const COURSE_STATUSES: CourseStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (quoted) {
      if (character === '"') {
        if (line[index + 1] === '"') {
          current += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        current += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      values.push(current.trim())
      current = ''
    } else {
      current += character
    }
  }

  values.push(current.trim())
  return values
}

function parseCsv(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine)
}

export const cursoHandlers = [
  http.get('/mock-api/cursos/courses', ({ request }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const url = new URL(request.url)
    const termId = url.searchParams.get('termId')
    const statusParam = url.searchParams.get('status')
    if (statusParam && !COURSE_STATUSES.includes(statusParam as CourseStatus)) {
      return badRequest('El estado solicitado no es válido.')
    }
    const status = statusParam as CourseStatus | null

    const visible = mockState.db.courses.filter((course) => {
      if (course.tenantId !== auth.tenantId) {
        return false
      }
      if (termId && course.termId !== termId) {
        return false
      }
      if (status && course.status !== status) {
        return false
      }
      if (auth.role === 'ADMIN') {
        return true
      }
      if (auth.role === 'TEACHER') {
        return course.ownerId === auth.userId
      }
      return course.status === 'PUBLISHED' && isEnrolled(course.courseId, auth.userId)
    })

    const page = paginate(visible, request)
    if (!page) {
      return badRequest('El token de paginación no es válido.')
    }

    return HttpResponse.json({
      items: page.items.map(toCourse),
      nextToken: page.nextToken,
    })
  }),

  http.post('/mock-api/cursos/courses', async ({ request }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }
    if (auth.role !== 'TEACHER' && auth.role !== 'ADMIN') {
      return forbidden()
    }

    const body = await readJson(request)
    if (!body) {
      return badRequest()
    }

    const { termId, code, title, description } = body
    if (
      !isNonEmptyString(termId) ||
      !isNonEmptyString(code) ||
      !isNonEmptyString(title)
    ) {
      return badRequest('El periodo, código y título son obligatorios.')
    }
    if (!/^[A-Z0-9-]{2,20}$/.test(code)) {
      return badRequest('El código del curso no tiene un formato válido.')
    }
    if (title.length > 200) {
      return badRequest('El título no puede superar los 200 caracteres.')
    }
    if (description !== undefined && typeof description !== 'string') {
      return badRequest('La descripción no es válida.')
    }
    if (typeof description === 'string' && description.length > 2000) {
      return badRequest('La descripción no puede superar los 2000 caracteres.')
    }

    const term = mockState.db.terms.find(
      (item) =>
        item.tenantId === auth.tenantId &&
        item.termId === termId &&
        item.status === 'ACTIVE',
    )
    if (!term) {
      return conflict('PERIODO_NO_ACTIVO', 'El periodo no existe o no está activo.')
    }

    const duplicate = mockState.db.courses.some(
      (course) =>
        course.tenantId === auth.tenantId &&
        course.termId === termId &&
        course.code === code,
    )
    if (duplicate) {
      return conflict(
        'CURSO_DUPLICADO',
        'Ya existe un curso con ese código en el periodo.',
      )
    }

    const course = {
      tenantId: auth.tenantId,
      courseId: nextId('crs'),
      termId,
      code,
      title: title.trim(),
      description: typeof description === 'string' ? description : undefined,
      status: 'DRAFT' as const,
      ownerId: auth.userId,
      createdAt: new Date().toISOString(),
    }
    mockState.db.courses.push(course)

    return HttpResponse.json(toCourse(course), { status: 201 })
  }),

  http.get('/mock-api/cursos/courses/:courseId', ({ request, params }) => {
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

    return HttpResponse.json(toCourse(course))
  }),

  http.patch('/mock-api/cursos/courses/:courseId', async ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const course = findCourse(auth, String(params.courseId))
    if (!course) {
      return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
    }
    if (!canManageCourse(auth, course)) {
      return forbidden()
    }

    const body = await readJson(request)
    if (!body) {
      return badRequest()
    }

    const { title, description } = body
    if (title !== undefined) {
      if (!isNonEmptyString(title) || title.length > 200) {
        return badRequest('El título no es válido.')
      }
      course.title = title.trim()
    }
    if (description !== undefined) {
      if (typeof description !== 'string' || description.length > 2000) {
        return badRequest('La descripción no es válida.')
      }
      course.description = description
    }

    return HttpResponse.json(toCourse(course))
  }),

  http.post('/mock-api/cursos/courses/:courseId/publish', ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const course = findCourse(auth, String(params.courseId))
    if (!course) {
      return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
    }
    if (!canManageCourse(auth, course)) {
      return forbidden()
    }
    if (course.status !== 'DRAFT') {
      return conflict('ESTADO_INVALIDO', 'Solo se puede publicar un curso en borrador.')
    }

    course.status = 'PUBLISHED'
    return HttpResponse.json(toCourse(course))
  }),

  http.post('/mock-api/cursos/courses/:courseId/archive', ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const course = findCourse(auth, String(params.courseId))
    if (!course) {
      return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
    }
    if (!canManageCourse(auth, course)) {
      return forbidden()
    }
    if (course.status === 'ARCHIVED') {
      return conflict('ESTADO_INVALIDO', 'El curso ya está archivado.')
    }

    course.status = 'ARCHIVED'
    return HttpResponse.json(toCourse(course))
  }),

  http.get('/mock-api/cursos/courses/:courseId/sections', ({ request, params }) => {
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

    const sections = mockState.db.sections.filter(
      (section) =>
        section.tenantId === auth.tenantId && section.courseId === course.courseId,
    )

    return HttpResponse.json({ items: sections.map(toSection) })
  }),

  http.post(
    '/mock-api/cursos/courses/:courseId/sections',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }

      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canManageCourse(auth, course)) {
        return forbidden()
      }

      const body = await readJson(request)
      if (!body || !isNonEmptyString(body.name) || body.name.length > 40) {
        return badRequest('El nombre de la sección no es válido.')
      }

      const section = {
        tenantId: auth.tenantId,
        courseId: course.courseId,
        sectionId: nextId('sec'),
        name: body.name.trim(),
      }
      mockState.db.sections.push(section)

      return HttpResponse.json(toSection(section), { status: 201 })
    },
  ),

  http.get('/mock-api/cursos/courses/:courseId/enrollments', ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const course = findCourse(auth, String(params.courseId))
    if (!course) {
      return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
    }
    if (!canManageCourse(auth, course)) {
      return forbidden()
    }

    const url = new URL(request.url)
    const role = url.searchParams.get('role')
    if (role && role !== 'STUDENT' && role !== 'TEACHER') {
      return badRequest('El rol solicitado no es válido.')
    }

    const enrollments = mockState.db.enrollments.filter(
      (enrollment) =>
        enrollment.tenantId === auth.tenantId &&
        enrollment.courseId === course.courseId &&
        (!role || enrollment.role === role),
    )

    const page = paginate(enrollments, request)
    if (!page) {
      return badRequest('El token de paginación no es válido.')
    }

    return HttpResponse.json({
      items: page.items.map(toEnrollment),
      nextToken: page.nextToken,
    })
  }),

  http.post(
    '/mock-api/cursos/courses/:courseId/enrollments',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }

      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canManageCourse(auth, course)) {
        return forbidden()
      }
      if (course.status === 'ARCHIVED') {
        return conflict(
          'CURSO_ARCHIVADO',
          'No se puede matricular en un curso archivado.',
        )
      }

      const body = await readJson(request)
      if (!body || !isNonEmptyString(body.userId)) {
        return badRequest('El usuario es obligatorio.')
      }
      if (body.role !== 'STUDENT' && body.role !== 'TEACHER') {
        return badRequest('El rol de la matrícula no es válido.')
      }
      const enrollmentRole = body.role as 'STUDENT' | 'TEACHER'

      const user = mockState.db.users.find(
        (item) => item.tenantId === auth.tenantId && item.userId === body.userId,
      )
      if (!user) {
        return notFound('USUARIO_NO_EXISTE', 'No existe el usuario en este tenant.')
      }

      const sectionId =
        typeof body.sectionId === 'string' && body.sectionId.length > 0
          ? body.sectionId
          : undefined
      if (sectionId) {
        const section = mockState.db.sections.find(
          (item) =>
            item.tenantId === auth.tenantId &&
            item.courseId === course.courseId &&
            item.sectionId === sectionId,
        )
        if (!section) {
          return badRequest('La sección no pertenece al curso.')
        }
      }

      if (isEnrolled(course.courseId, user.userId)) {
        return conflict('YA_MATRICULADO', 'El usuario ya está matriculado.')
      }

      const enrollment = {
        tenantId: auth.tenantId,
        courseId: course.courseId,
        enrollmentId: nextId('enr'),
        userId: user.userId,
        role: enrollmentRole,
        sectionId,
        createdAt: new Date().toISOString(),
      }
      mockState.db.enrollments.push(enrollment)

      return HttpResponse.json(toEnrollment(enrollment), { status: 201 })
    },
  ),

  http.post(
    '/mock-api/cursos/courses/:courseId/enrollments/import',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }

      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canManageCourse(auth, course)) {
        return forbidden()
      }
      if (course.status === 'ARCHIVED') {
        return conflict(
          'CURSO_ARCHIVADO',
          'No se puede matricular en un curso archivado.',
        )
      }

      const rows = parseCsv(await request.text())
      const header = rows[0]
      if (!header) {
        return badRequest('El CSV está vacío.')
      }
      const headerNames = header.map((value) => value.trim().toLowerCase())
      if (
        headerNames[0] !== 'institutionalcode' ||
        headerNames[1] !== 'role' ||
        headerNames[2] !== 'section'
      ) {
        return badRequest('La cabecera del CSV debe ser institutionalCode,role,section.')
      }
      if (rows.length - 1 > 2000) {
        return badRequest('El CSV no puede superar las 2000 filas.')
      }

      const courseSections = mockState.db.sections.filter(
        (section) =>
          section.tenantId === auth.tenantId && section.courseId === course.courseId,
      )

      let created = 0
      let skipped = 0
      const errors: ImportError[] = []

      rows.slice(1).forEach((row, index) => {
        const line = index + 2
        const institutionalCode = (row[0] ?? '').trim()
        const roleRaw = (row[1] ?? '').trim().toUpperCase()
        const sectionName = (row[2] ?? '').trim()

        if (!institutionalCode) {
          errors.push({ line, institutionalCode, code: 'CODIGO_REQUERIDO' })
          return
        }

        const user = mockState.db.users.find(
          (item) =>
            item.tenantId === auth.tenantId &&
            item.institutionalCode === institutionalCode,
        )
        if (!user) {
          errors.push({ line, institutionalCode, code: 'USUARIO_NO_EXISTE' })
          return
        }

        if (roleRaw !== 'STUDENT' && roleRaw !== 'TEACHER') {
          errors.push({ line, institutionalCode, code: 'ROL_INVALIDO' })
          return
        }

        let sectionId: string | undefined
        if (sectionName) {
          const section = courseSections.find(
            (item) => item.name.toLowerCase() === sectionName.toLowerCase(),
          )
          if (!section) {
            errors.push({ line, institutionalCode, code: 'SECCION_NO_EXISTE' })
            return
          }
          sectionId = section.sectionId
        }

        if (isEnrolled(course.courseId, user.userId)) {
          skipped += 1
          return
        }

        mockState.db.enrollments.push({
          tenantId: auth.tenantId,
          courseId: course.courseId,
          enrollmentId: nextId('enr'),
          userId: user.userId,
          role: roleRaw,
          sectionId,
          createdAt: new Date().toISOString(),
        })
        created += 1
      })

      const result: ImportResult = { created, skipped, errors }
      return HttpResponse.json(result)
    },
  ),

  http.delete(
    '/mock-api/cursos/courses/:courseId/enrollments/:enrollmentId',
    ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }

      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canManageCourse(auth, course)) {
        return forbidden()
      }

      const index = mockState.db.enrollments.findIndex(
        (enrollment) =>
          enrollment.tenantId === auth.tenantId &&
          enrollment.courseId === course.courseId &&
          enrollment.enrollmentId === params.enrollmentId,
      )
      if (index === -1) {
        return notFound('MATRICULA_NO_ENCONTRADA', 'No existe la matrícula.')
      }

      mockState.db.enrollments.splice(index, 1)
      return new HttpResponse(null, { status: 204 })
    },
  ),
]
