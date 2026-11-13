import { api } from './client'
import type {
  Grade,
  GradeHistory,
  GradeList,
  GradeOverride,
  Gradebook,
  PostResult,
} from './types'

const id = encodeURIComponent

export function getGradebook(courseId: string): Promise<Gradebook> {
  return api.get<Gradebook>('calificaciones', `/courses/${id(courseId)}/gradebook`)
}

export function getMyGrades(courseId: string): Promise<GradeList> {
  return api.get<GradeList>('calificaciones', `/courses/${id(courseId)}/grades/me`)
}

export function postGradeItem(gradeItemId: string): Promise<PostResult> {
  return api.post<PostResult>('calificaciones', `/grade-items/${id(gradeItemId)}/post`)
}

export function overrideGrade(gradeId: string, input: GradeOverride): Promise<Grade> {
  return api.patch<Grade>('calificaciones', `/grades/${id(gradeId)}`, input)
}

export function getGradeHistory(gradeId: string): Promise<GradeHistory> {
  return api.get<GradeHistory>('calificaciones', `/grades/${id(gradeId)}/history`)
}
