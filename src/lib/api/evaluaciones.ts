import { api } from './client'
import { buildQuery } from './query'
import type {
  Assignment,
  AssignmentInput,
  AssignmentPage,
  AssignmentUpdate,
  GradeInput,
  Submission,
  SubmissionInput,
  SubmissionPage,
} from './types'

export interface PageParams {
  limit?: number
  nextToken?: string | null
}

const id = encodeURIComponent

export function listAssignments(
  courseId: string,
  params: PageParams = {},
): Promise<AssignmentPage> {
  return api.get<AssignmentPage>(
    'evaluaciones',
    `/courses/${id(courseId)}/assignments${buildQuery(params)}`,
  )
}

export function createAssignment(
  courseId: string,
  input: AssignmentInput,
): Promise<Assignment> {
  return api.post<Assignment>(
    'evaluaciones',
    `/courses/${id(courseId)}/assignments`,
    input,
  )
}

export function getAssignment(assignmentId: string): Promise<Assignment> {
  return api.get<Assignment>('evaluaciones', `/assignments/${id(assignmentId)}`)
}

export function updateAssignment(
  assignmentId: string,
  input: AssignmentUpdate,
): Promise<Assignment> {
  return api.patch<Assignment>('evaluaciones', `/assignments/${id(assignmentId)}`, input)
}

export function publishAssignment(assignmentId: string): Promise<Assignment> {
  return api.post<Assignment>('evaluaciones', `/assignments/${id(assignmentId)}/publish`)
}

export function listSubmissions(
  assignmentId: string,
  params: PageParams = {},
): Promise<SubmissionPage> {
  return api.get<SubmissionPage>(
    'evaluaciones',
    `/assignments/${id(assignmentId)}/submissions${buildQuery(params)}`,
  )
}

export function submitAssignment(
  assignmentId: string,
  input: SubmissionInput,
): Promise<Submission> {
  return api.post<Submission>(
    'evaluaciones',
    `/assignments/${id(assignmentId)}/submissions`,
    input,
  )
}

export function getSubmission(submissionId: string): Promise<Submission> {
  return api.get<Submission>('evaluaciones', `/submissions/${id(submissionId)}`)
}

export function gradeSubmission(
  submissionId: string,
  input: GradeInput,
): Promise<Submission> {
  return api.post<Submission>(
    'evaluaciones',
    `/submissions/${id(submissionId)}/grade`,
    input,
  )
}
