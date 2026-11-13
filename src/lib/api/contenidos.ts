import { api } from './client'
import type {
  Module,
  ModuleInput,
  ModuleItem,
  ModuleItemInput,
  ModuleList,
  ModuleUpdate,
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
