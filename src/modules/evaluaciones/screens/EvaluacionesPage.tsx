import { CalendarClock, ClipboardList, Pencil, Plus, Send, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, CardContent, EmptyState, Spinner } from '@/components/ui'
import { useAuth } from '@/features/auth/auth-context'
import {
  listAssignments,
  listSubmissions,
  publishAssignment,
} from '@/lib/api/evaluaciones'
import type { Assignment, Course, Submission } from '@/lib/api/types'
import { listUsers } from '@/lib/api/usuarios'
import { errorMessage, formatDateTime, formatScore } from '@/lib/format'
import { useApi } from '@/lib/hooks/useApi'
import { CoursePicker } from '@/modules/cursos/components/CoursePicker'
import { AssignmentFormModal } from '../components/AssignmentFormModal'
import { FeedbackView } from '../components/FeedbackView'
import { FileLinks } from '../components/FileLinks'
import { SubmissionsModal } from '../components/SubmissionsModal'
import { SubmitAssignmentModal } from '../components/SubmitAssignmentModal'

function isPastDue(assignment: Assignment): boolean {
  return Date.now() > Date.parse(assignment.dueAt)
}

function DueLine({ assignment }: { assignment: Assignment }) {
  const pastDue = isPastDue(assignment)
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1">
        <CalendarClock className="size-3.5" aria-hidden />
        {pastDue ? 'Venció' : 'Vence'} el {formatDateTime(assignment.dueAt)}
      </span>
      <span>Puntaje máximo: {formatScore(assignment.maxScore)}</span>
      {assignment.allowLate ? <span>Acepta entregas tardías</span> : null}
    </p>
  )
}

export function EvaluacionesPage() {
  const { session } = useAuth()
  if (!session) {
    return null
  }
  const isTeacher = session.role === 'TEACHER'
  const isStudent = session.role === 'STUDENT'

  return (
    <div>
      <PageHeader
        eyebrow="Académico"
        title="Evaluaciones"
        description={
          isTeacher
            ? 'Crea tareas, publícalas y califica las entregas con rúbrica.'
            : isStudent
              ? 'Tus tareas, fechas límite y entregas.'
              : 'Tareas de los cursos de tu institución (solo lectura).'
        }
      />
      <CoursePicker
        filter={(course) => course.status !== 'ARCHIVED'}
        emptyTitle="No hay cursos con evaluaciones"
        emptyDescription={
          isTeacher
            ? 'Crea un curso para poder agregarle tareas.'
            : 'Cuando estés matriculado en un curso publicado, verás sus tareas aquí.'
        }
      >
        {(course) =>
          isStudent ? (
            <StudentAssignments key={course.courseId} course={course} />
          ) : (
            <TeacherAssignments key={course.courseId} course={course} />
          )
        }
      </CoursePicker>
    </div>
  )
}

function useAssignments(courseId: string) {
  return useApi(() => listAssignments(courseId, { limit: 100 }), [courseId])
}

function ListState({
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
}: {
  loading: boolean
  error: string | null
  empty: boolean
  emptyTitle: string
  emptyDescription: string
}) {
  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (error) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </p>
    )
  }
  if (empty) {
    return (
      <EmptyState
        icon={<ClipboardList className="size-6" aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }
  return null
}

function TeacherAssignments({ course }: { course: Course }) {
  const { session } = useAuth()
  const state = useAssignments(course.courseId)
  const studentsState = useApi(() => listUsers({ role: 'STUDENT', limit: 100 }), [])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [reviewing, setReviewing] = useState<Assignment | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const studentNames = useMemo(
    () =>
      new Map(
        (studentsState.data?.items ?? []).map((user) => [
          user.userId,
          `${user.givenName} ${user.familyName}`,
        ]),
      ),
    [studentsState.data],
  )
  const isOwner = session?.role === 'TEACHER' && course.ownerId === session.userId
  const canManage = isOwner && course.status !== 'ARCHIVED'
  const assignments = state.data?.items ?? []

  async function handlePublish(assignment: Assignment) {
    setActionError(null)
    setPublishingId(assignment.assignmentId)
    try {
      await publishAssignment(assignment.assignmentId)
      state.reload()
    } catch (cause) {
      setActionError(errorMessage(cause))
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Tareas del curso</h2>
        {canManage ? (
          <Button
            leftIcon={<Plus className="size-4" aria-hidden />}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Nueva tarea
          </Button>
        ) : null}
      </div>
      {course.status === 'DRAFT' ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El curso está en borrador: los alumnos verán las tareas cuando publiques el
          curso.
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </p>
      ) : null}

      <ListState
        loading={state.loading}
        error={state.error}
        empty={assignments.length === 0}
        emptyTitle="Todavía no hay tareas"
        emptyDescription="Crea la primera tarea del curso; se guarda como borrador hasta que la publiques."
      />

      {!state.loading && !state.error
        ? assignments.map((assignment) => (
            <Card key={assignment.assignmentId}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{assignment.title}</p>
                    <Badge
                      variant={assignment.status === 'PUBLISHED' ? 'success' : 'warning'}
                    >
                      {assignment.status === 'PUBLISHED' ? 'Publicada' : 'Borrador'}
                    </Badge>
                  </div>
                  <DueLine assignment={assignment} />
                  {assignment.instructions ? (
                    <p className="line-clamp-2 text-sm text-slate-600">
                      {assignment.instructions}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {canManage ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Pencil className="size-4" aria-hidden />}
                      onClick={() => {
                        setEditing(assignment)
                        setFormOpen(true)
                      }}
                    >
                      Editar
                    </Button>
                  ) : null}
                  {canManage && assignment.status === 'DRAFT' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Send className="size-4" aria-hidden />}
                      loading={publishingId === assignment.assignmentId}
                      onClick={() => void handlePublish(assignment)}
                    >
                      Publicar
                    </Button>
                  ) : null}
                  {isOwner && assignment.status === 'PUBLISHED' ? (
                    <Button size="sm" onClick={() => setReviewing(assignment)}>
                      Ver entregas
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        : null}

      <AssignmentFormModal
        courseId={course.courseId}
        assignment={editing}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          state.reload()
        }}
      />
      <SubmissionsModal
        assignment={reviewing}
        studentNames={studentNames}
        onClose={() => setReviewing(null)}
      />
    </div>
  )
}

function StudentAssignments({ course }: { course: Course }) {
  const state = useAssignments(course.courseId)
  const [submitting, setSubmitting] = useState<Assignment | null>(null)
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const assignments = state.data?.items ?? []

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-900">Tareas del curso</h2>
      {notice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}
      <ListState
        loading={state.loading}
        error={state.error}
        empty={assignments.length === 0}
        emptyTitle="No hay tareas publicadas"
        emptyDescription="Cuando tu docente publique una tarea, aparecerá aquí."
      />
      {!state.loading && !state.error
        ? assignments.map((assignment) => (
            <StudentAssignmentCard
              key={`${assignment.assignmentId}:${revision}`}
              assignment={assignment}
              onSubmit={() => {
                setNotice(null)
                setSubmitting(assignment)
              }}
            />
          ))
        : null}

      <SubmitAssignmentModal
        assignment={submitting}
        onClose={() => setSubmitting(null)}
        onSubmitted={(submission) => {
          setSubmitting(null)
          setNotice(
            `Entrega recibida (intento ${submission.attempt})${submission.late ? ', marcada como tardía' : ''}.`,
          )
          setRevision((value) => value + 1)
        }}
      />
    </div>
  )
}

function latest(submissions: Submission[]): Submission | null {
  return submissions.reduce<Submission | null>(
    (best, item) => (!best || item.attempt > best.attempt ? item : best),
    null,
  )
}

function StudentAssignmentCard({
  assignment,
  onSubmit,
}: {
  assignment: Assignment
  onSubmit: () => void
}) {
  const state = useApi(
    () => listSubmissions(assignment.assignmentId, { limit: 20 }),
    [assignment.assignmentId],
  )
  const last = latest(state.data?.items ?? [])
  const pastDue = isPastDue(assignment)
  const canSubmit = !pastDue || Boolean(assignment.allowLate)
  const graded = last?.status === 'GRADED' && last.score != null

  let badge: {
    label: string
    variant: 'success' | 'warning' | 'danger' | 'neutral' | 'brand'
  }
  if (graded) {
    badge = { label: 'Calificada', variant: 'success' }
  } else if (last) {
    badge = { label: last.late ? 'Entregada tarde' : 'Entregada', variant: 'brand' }
  } else if (pastDue && !assignment.allowLate) {
    badge = { label: 'Vencida', variant: 'danger' }
  } else {
    badge = { label: 'Pendiente', variant: 'warning' }
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{assignment.title}</p>
              {state.loading ? null : (
                <Badge variant={badge.variant}>{badge.label}</Badge>
              )}
            </div>
            <DueLine assignment={assignment} />
            {assignment.instructions ? (
              <p className="whitespace-pre-line text-sm text-slate-600">
                {assignment.instructions}
              </p>
            ) : null}
          </div>
          {canSubmit && !graded ? (
            <Button
              size="sm"
              className="shrink-0"
              leftIcon={<Upload className="size-4" aria-hidden />}
              onClick={onSubmit}
            >
              {last ? 'Volver a entregar' : 'Entregar'}
            </Button>
          ) : null}
        </div>

        {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
        {last ? (
          <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
            <p className="text-slate-600">
              Tu entrega · intento {last.attempt} · {formatDateTime(last.submittedAt)}
              {last.late ? ' · tardía' : ''}
            </p>
            <FileLinks fileIds={last.fileIds} />
            {graded ? (
              <div className="space-y-2 border-t border-slate-200 pt-2">
                <p className="font-semibold text-slate-900">
                  Nota: {formatScore(last.score ?? 0)}/{formatScore(assignment.maxScore)}
                </p>
                <FeedbackView feedback={last.feedback} />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Verás tu nota cuando el docente la publique.
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
