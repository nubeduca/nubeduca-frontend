import { http, HttpResponse } from 'msw'
import type { ModuleItem } from '@/lib/api/types'
import { mockState } from '../db'
import { toModule } from '../mappers'
import { nextId } from './utils'
import {
  badRequest,
  conflict,
  forbidden,
  getAuth,
  isNonEmptyString,
  notFound,
  readJson,
  unauthorized,
} from './utils'
import { canManageModules, canSeeCourse, findCourse, findModule } from './course-access'

export const contenidoHandlers = [
  http.get('/mock-api/contenidos/courses/:courseId/modules', ({ request, params }) => {
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

    const modules = mockState.db.modules
      .filter(
        (module) =>
          module.tenantId === auth.tenantId &&
          module.courseId === course.courseId &&
          (auth.role !== 'STUDENT' || module.status === 'PUBLISHED'),
      )
      .sort((left, right) => left.position - right.position)

    return HttpResponse.json({ items: modules.map(toModule) })
  }),

  http.post(
    '/mock-api/contenidos/courses/:courseId/modules',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      if (auth.role !== 'TEACHER') {
        return forbidden()
      }

      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canManageModules(auth, course)) {
        return forbidden()
      }

      const body = await readJson(request)
      if (!body) {
        return badRequest()
      }
      if (!isNonEmptyString(body.title) || body.title.length > 200) {
        return badRequest('El título del módulo no es válido.')
      }
      if (
        typeof body.position !== 'number' ||
        !Number.isInteger(body.position) ||
        body.position < 1
      ) {
        return badRequest('La posición del módulo no es válida.')
      }

      const module = {
        tenantId: auth.tenantId,
        courseId: course.courseId,
        moduleId: nextId('mod'),
        title: body.title.trim(),
        position: body.position,
        status: 'DRAFT' as const,
        items: [],
      }
      mockState.db.modules.push(module)

      return HttpResponse.json(toModule(module), { status: 201 })
    },
  ),

  http.get(
    '/mock-api/contenidos/courses/:courseId/modules/:moduleId',
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

      const module = findModule(auth, course.courseId, String(params.moduleId))
      if (!module) {
        return notFound('MODULO_NO_ENCONTRADO', 'No existe el módulo.')
      }
      if (auth.role === 'STUDENT' && module.status !== 'PUBLISHED') {
        return forbidden()
      }

      return HttpResponse.json(toModule(module))
    },
  ),

  http.patch(
    '/mock-api/contenidos/courses/:courseId/modules/:moduleId',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      if (auth.role !== 'TEACHER') {
        return forbidden()
      }

      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canManageModules(auth, course)) {
        return forbidden()
      }

      const module = findModule(auth, course.courseId, String(params.moduleId))
      if (!module) {
        return notFound('MODULO_NO_ENCONTRADO', 'No existe el módulo.')
      }

      const body = await readJson(request)
      if (!body) {
        return badRequest()
      }

      if (body.title !== undefined) {
        if (!isNonEmptyString(body.title) || body.title.length > 200) {
          return badRequest('El título del módulo no es válido.')
        }
        module.title = body.title.trim()
      }
      if (body.position !== undefined) {
        if (
          typeof body.position !== 'number' ||
          !Number.isInteger(body.position) ||
          body.position < 1
        ) {
          return badRequest('La posición del módulo no es válida.')
        }
        module.position = body.position
      }

      return HttpResponse.json(toModule(module))
    },
  ),

  http.post(
    '/mock-api/contenidos/courses/:courseId/modules/:moduleId/items',
    async ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      if (auth.role !== 'TEACHER') {
        return forbidden()
      }

      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canManageModules(auth, course)) {
        return forbidden()
      }

      const module = findModule(auth, course.courseId, String(params.moduleId))
      if (!module) {
        return notFound('MODULO_NO_ENCONTRADO', 'No existe el módulo.')
      }

      const body = await readJson(request)
      if (!body) {
        return badRequest()
      }
      const type = body.type
      if (type !== 'PAGE' && type !== 'FILE' && type !== 'LINK') {
        return badRequest('El tipo de ítem no es válido.')
      }
      if (!isNonEmptyString(body.title) || body.title.length > 200) {
        return badRequest('El título del ítem no es válido.')
      }

      const item: ModuleItem = {
        itemId: nextId('itm'),
        type,
        title: body.title.trim(),
        position: module.items.length + 1,
      }

      if (type === 'PAGE') {
        if (body.body !== undefined) {
          if (typeof body.body !== 'string' || body.body.length > 50000) {
            return badRequest('El contenido de la página no es válido.')
          }
          item.body = body.body
        }
      }

      if (type === 'LINK') {
        if (!isNonEmptyString(body.url)) {
          return badRequest('El enlace es obligatorio.')
        }
        try {
          new URL(body.url)
        } catch {
          return badRequest('El enlace no es válido.')
        }
        item.url = body.url
      }

      if (type === 'FILE') {
        if (!isNonEmptyString(body.fileId)) {
          return badRequest('El archivo es obligatorio.')
        }
        item.fileId = body.fileId
      }

      module.items.push(item)
      return HttpResponse.json(item, { status: 201 })
    },
  ),

  http.post(
    '/mock-api/contenidos/courses/:courseId/modules/:moduleId/publish',
    ({ request, params }) => {
      const auth = getAuth(request)
      if (!auth) {
        return unauthorized()
      }
      if (auth.role !== 'TEACHER') {
        return forbidden()
      }

      const course = findCourse(auth, String(params.courseId))
      if (!course) {
        return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
      }
      if (!canManageModules(auth, course)) {
        return forbidden()
      }

      const module = findModule(auth, course.courseId, String(params.moduleId))
      if (!module) {
        return notFound('MODULO_NO_ENCONTRADO', 'No existe el módulo.')
      }
      if (module.status === 'PUBLISHED') {
        return conflict('ESTADO_INVALIDO', 'El módulo ya está publicado.')
      }
      if (module.items.length === 0) {
        return conflict('MODULO_SIN_ITEMS', 'Agrega al menos un ítem antes de publicar.')
      }

      module.status = 'PUBLISHED'
      return HttpResponse.json(toModule(module))
    },
  ),
]
