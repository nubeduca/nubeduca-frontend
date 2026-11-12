import { api } from './client'
import type {
  DownloadLink,
  Module,
  ModuleInput,
  ModuleItem,
  ModuleItemInput,
  ModuleList,
  ModuleUpdate,
  UploadRequest,
  UploadTicket,
} from './types'

export function listModules(courseId: string): Promise<ModuleList> {
  return api.get<ModuleList>(
    'contenidos',
    `/courses/${encodeURIComponent(courseId)}/modules`,
  )
}

export function getModule(courseId: string, moduleId: string): Promise<Module> {
  return api.get<Module>(
    'contenidos',
    `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
  )
}

export function createModule(courseId: string, input: ModuleInput): Promise<Module> {
  return api.post<Module>(
    'contenidos',
    `/courses/${encodeURIComponent(courseId)}/modules`,
    input,
  )
}

export function updateModule(
  courseId: string,
  moduleId: string,
  input: ModuleUpdate,
): Promise<Module> {
  return api.patch<Module>(
    'contenidos',
    `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
    input,
  )
}

export function addModuleItem(
  courseId: string,
  moduleId: string,
  input: ModuleItemInput,
): Promise<ModuleItem> {
  return api.post<ModuleItem>(
    'contenidos',
    `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/items`,
    input,
  )
}

export function publishModule(courseId: string, moduleId: string): Promise<Module> {
  return api.post<Module>(
    'contenidos',
    `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/publish`,
  )
}

export function createUpload(input: UploadRequest): Promise<UploadTicket> {
  return api.post<UploadTicket>('contenidos', '/files', input)
}

export function getDownloadLink(fileId: string): Promise<DownloadLink> {
  return api.get<DownloadLink>(
    'contenidos',
    `/files/${encodeURIComponent(fileId)}/download`,
  )
}

/** Pide el ticket a ms-contenidos y sube el archivo directo a S3 con PUT. */
export async function uploadFile(
  courseId: string,
  purpose: UploadRequest['purpose'],
  file: File,
): Promise<string> {
  const ticket = await createUpload({
    courseId,
    purpose,
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  })

  const response = await fetch(ticket.uploadUrl, {
    method: ticket.method,
    headers: ticket.headers,
    body: file,
  })
  if (!response.ok) {
    throw new Error(`No se pudo subir ${file.name} (${response.status}).`)
  }

  return ticket.fileId
}
