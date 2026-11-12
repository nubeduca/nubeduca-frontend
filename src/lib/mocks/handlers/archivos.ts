import { http, HttpResponse } from 'msw'
import type { FilePurpose } from '@/lib/api/types'
import { mockState } from '../db'
import { canManageModules, canSeeCourse, findCourse } from './course-access'
import { nowIso } from './notify'
import {
  badRequest,
  forbidden,
  getAuth,
  isNonEmptyString,
  nextId,
  notFound,
  readJson,
  unauthorized,
} from './utils'

const MAX_BYTES = 52_428_800
const PURPOSES: FilePurpose[] = ['CONTENT', 'SUBMISSION']

/** Archivos de ms-contenidos (CON-01) y la "subida a S3" simulada. */
export const archivoHandlers = [
  http.post('/mock-api/contenidos/files', async ({ request }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const body = await readJson(request)
    if (
      !body ||
      !isNonEmptyString(body.courseId) ||
      !PURPOSES.includes(body.purpose as FilePurpose) ||
      !isNonEmptyString(body.fileName) ||
      body.fileName.length > 200 ||
      !isNonEmptyString(body.contentType) ||
      typeof body.sizeBytes !== 'number' ||
      body.sizeBytes < 1
    ) {
      return badRequest()
    }
    if (body.sizeBytes > MAX_BYTES) {
      return badRequest('El archivo supera los 50 MB.')
    }

    const course = findCourse(auth, body.courseId)
    if (!course) {
      return notFound('CURSO_NO_ENCONTRADO', 'No existe el curso en este tenant.')
    }
    const purpose = body.purpose as FilePurpose
    if (purpose === 'CONTENT' && !canManageModules(auth, course)) {
      return forbidden()
    }
    if (
      purpose === 'SUBMISSION' &&
      (auth.role !== 'STUDENT' || !canSeeCourse(auth, course))
    ) {
      return forbidden()
    }

    const fileId = nextId('fil')
    mockState.db.files.push({
      tenantId: auth.tenantId,
      fileId,
      courseId: course.courseId,
      purpose,
      fileName: body.fileName,
      contentType: body.contentType,
      sizeBytes: body.sizeBytes,
      status: 'PENDING_UPLOAD',
      ownerId: auth.userId,
      createdAt: nowIso(),
    })

    return HttpResponse.json(
      {
        fileId,
        uploadUrl: `${window.location.origin}/mock-api/s3/${fileId}`,
        method: 'PUT',
        headers: { 'Content-Type': body.contentType },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      { status: 201 },
    )
  }),

  // En AWS el PUT va a S3 y el antivirus emite file.scanned; aquí queda CLEAN al toque.
  http.put('/mock-api/s3/:fileId', ({ params }) => {
    const file = mockState.db.files.find((item) => item.fileId === String(params.fileId))
    if (!file) {
      return new HttpResponse(null, { status: 404 })
    }
    file.status = 'CLEAN'
    return new HttpResponse(null, { status: 200 })
  }),

  http.get('/mock-api/s3/:fileId', ({ params }) => {
    const file = mockState.db.files.find((item) => item.fileId === String(params.fileId))
    if (!file) {
      return new HttpResponse(null, { status: 404 })
    }
    return new HttpResponse(
      `Archivo de demostración: ${file.fileName}\n(En AWS se descarga desde S3 con una URL prefirmada.)`,
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    )
  }),

  http.get('/mock-api/contenidos/files/:fileId/download', ({ request, params }) => {
    const auth = getAuth(request)
    if (!auth) {
      return unauthorized()
    }

    const file = mockState.db.files.find(
      (item) => item.tenantId === auth.tenantId && item.fileId === String(params.fileId),
    )
    if (!file) {
      return notFound('ARCHIVO_NO_ENCONTRADO', 'No existe el archivo.')
    }
    const course = findCourse(auth, file.courseId)
    const isOwner = file.ownerId === auth.userId
    const isTeacher = Boolean(course && canManageModules(auth, course))
    if (!isOwner && !isTeacher && auth.role !== 'ADMIN') {
      return forbidden()
    }
    if (file.status !== 'CLEAN') {
      return badRequest('El archivo todavía no está disponible.')
    }

    return HttpResponse.json({
      downloadUrl: `${window.location.origin}/mock-api/s3/${file.fileId}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
  }),
]
