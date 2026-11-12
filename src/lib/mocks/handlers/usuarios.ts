import { http, HttpResponse } from 'msw'
import { ROLES } from '@/lib/types'
import type { Role } from '@/lib/types'
import { mockState } from '../db'
import { toTerm, toUser } from '../mappers'
import { badRequest, forbidden, getAuth, notFound, paginate, unauthorized } from './utils'

export const usuarioHandlers = [
  http.get('/mock-api/usuarios/terms', ({ request }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const terms = mockState.db.terms
      .filter((term) => term.tenantId === auth.tenantId)
      .sort((left, right) => right.startsOn.localeCompare(left.startsOn))

    const page = paginate(terms, request)
    if (!page) {
      return badRequest('El token de paginación no es válido.')
    }

    return HttpResponse.json({
      items: page.items.map(toTerm),
      nextToken: page.nextToken,
    })
  }),

  http.get('/mock-api/usuarios/users', ({ request }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }
    if (auth.role !== 'TEACHER' && auth.role !== 'ADMIN') {
      return forbidden()
    }

    const url = new URL(request.url)
    const roleParam = url.searchParams.get('role')
    if (roleParam && !ROLES.includes(roleParam as Role)) {
      return badRequest('El rol solicitado no es válido.')
    }
    const role = roleParam as Role | null
    const institutionalCode = url.searchParams.get('institutionalCode')

    const users = mockState.db.users
      .filter(
        (user) =>
          user.tenantId === auth.tenantId &&
          (!role || user.role === role) &&
          (!institutionalCode || user.institutionalCode === institutionalCode),
      )
      .sort((left, right) => left.familyName.localeCompare(right.familyName))

    const page = paginate(users, request)
    if (!page) {
      return badRequest('El token de paginación no es válido.')
    }

    return HttpResponse.json({
      items: page.items.map(toUser),
      nextToken: page.nextToken,
    })
  }),

  http.get('/mock-api/usuarios/users/me', ({ request }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const user = mockState.db.users.find(
      (item) => item.tenantId === auth.tenantId && item.userId === auth.userId,
    )
    if (!user) {
      return notFound('USUARIO_NO_ENCONTRADO', 'No existe el usuario.')
    }

    return HttpResponse.json(toUser(user))
  }),

  http.get('/mock-api/usuarios/users/:userId', ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }
    if (auth.role !== 'TEACHER' && auth.role !== 'ADMIN') {
      return forbidden()
    }

    const user = mockState.db.users.find(
      (item) => item.tenantId === auth.tenantId && item.userId === String(params.userId),
    )
    if (!user) {
      return notFound('USUARIO_NO_ENCONTRADO', 'No existe el usuario.')
    }

    return HttpResponse.json(toUser(user))
  }),
]
