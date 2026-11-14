import { ClipboardCheck } from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui'
import { listSubmissions } from '@/lib/api/evaluaciones'
import type { Assignment, Submission } from '@/lib/api/types'
import { formatDateTime, formatScore } from '@/lib/format'
import { useApi } from '@/lib/hooks/useApi'
import { FileLinks } from './FileLinks'
import { GradeWithRubricModal } from './GradeWithRubricModal'

export interface SubmissionsModalProps {
  assignment: Assignment | null
  studentNames: Map<string, string>
  onClose: () => void
}

/** Último intento de cada alumno, más reciente primero. */
function latestAttempts(submissions: Submission[]): Submission[] {
  const latest = new Map<string, Submission>()
  for (const submission of submissions) {
    const current = latest.get(submission.studentId)
    if (!current || submission.attempt > current.attempt) {
      latest.set(submission.studentId, submission)
    }
  }
  return [...latest.values()].sort((left, right) =>
    right.submittedAt.localeCompare(left.submittedAt),
  )
}

export function SubmissionsModal(props: SubmissionsModalProps) {
  if (!props.assignment) {
    return null
  }
  return <SubmissionsContent {...props} assignment={props.assignment} />
}

function SubmissionsContent({
  assignment,
  studentNames,
  onClose,
}: SubmissionsModalProps & { assignment: Assignment }) {
  const state = useApi(
    () => listSubmissions(assignment.assignmentId, { limit: 100 }),
    [assignment.assignmentId],
  )
  const [grading, setGrading] = useState<Submission | null>(null)
  const submissions = latestAttempts(state.data?.items ?? [])
  const nameOf = (studentId: string) =>
    studentNames.get(studentId) ?? studentId.slice(0, 8)

  return (
    <>
      <Modal
        open={!grading}
        onClose={onClose}
        title={`Entregas: ${assignment.title}`}
        description={`Fecha límite: ${formatDateTime(assignment.dueAt)} · Puntaje máximo: ${formatScore(assignment.maxScore)}`}
        className="max-w-4xl"
        footer={
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        {state.loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : state.error ? (
          <p className="text-sm text-rose-700">{state.error}</p>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck className="size-6" aria-hidden />}
            title="Todavía no hay entregas"
            description="Cuando los alumnos entreguen, aparecerán aquí para calificarlas."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Alumno</TableHeaderCell>
                  <TableHeaderCell>Entregado</TableHeaderCell>
                  <TableHeaderCell>Archivos</TableHeaderCell>
                  <TableHeaderCell>Nota</TableHeaderCell>
                  <TableHeaderCell className="text-right">Acción</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.submissionId}>
                    <TableCell>
                      <p className="font-medium text-slate-900">
                        {nameOf(submission.studentId)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Intento {submission.attempt}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="whitespace-nowrap">
                        {formatDateTime(submission.submittedAt)}
                      </p>
                      {submission.late ? <Badge variant="warning">Tardía</Badge> : null}
                    </TableCell>
                    <TableCell>
                      <FileLinks fileIds={submission.fileIds} />
                      {submission.comment ? (
                        <p className="mt-1 max-w-xs text-xs text-slate-500">
                          “{submission.comment}”
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {submission.status === 'GRADED' && submission.score != null ? (
                        <Badge variant="success">
                          {formatScore(submission.score)}/
                          {formatScore(assignment.maxScore)}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Sin calificar</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={submission.status === 'GRADED' ? 'outline' : 'primary'}
                        onClick={() => setGrading(submission)}
                      >
                        {submission.status === 'GRADED' ? 'Recalificar' : 'Calificar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Modal>

      <GradeWithRubricModal
        assignment={assignment}
        submission={grading}
        studentName={grading ? nameOf(grading.studentId) : ''}
        onClose={() => setGrading(null)}
        onGraded={() => {
          setGrading(null)
          state.reload()
        }}
      />
    </>
  )
}
