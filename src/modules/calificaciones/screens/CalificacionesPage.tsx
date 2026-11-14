import { GraduationCap, Send } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
} from '@/components/ui'
import { useAuth } from '@/features/auth/auth-context'
import { getGradebook, getMyGrades, postGradeItem } from '@/lib/api/calificaciones'
import { listSubmissions } from '@/lib/api/evaluaciones'
import type { Course, Grade, GradeItem } from '@/lib/api/types'
import { errorMessage, formatDateTime, formatScore } from '@/lib/format'
import { useApi } from '@/lib/hooks/useApi'
import { useUserNames } from '@/lib/hooks/useUsers'
import { CoursePicker } from '@/modules/cursos/components/CoursePicker'
import { FeedbackView } from '@/modules/evaluaciones/components/FeedbackView'
import { GradeOverrideModal } from '../components/GradeOverrideModal'

/** Promedio en escala vigesimal: suma de puntajes sobre suma de máximos. */
function average(grades: Grade[]): number | null {
  const max = grades.reduce((sum, grade) => sum + grade.maxScore, 0)
  if (max === 0) {
    return null
  }
  const score = grades.reduce((sum, grade) => sum + grade.score, 0)
  return (score / max) * 20
}

function Alert({
  children,
  tone = 'error',
}: {
  children: string
  tone?: 'error' | 'ok'
}) {
  return (
    <p
      className={
        tone === 'error'
          ? 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'
          : 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
      }
    >
      {children}
    </p>
  )
}

export function CalificacionesPage() {
  const { session } = useAuth()
  if (!session) {
    return null
  }
  const isTeacher = session.role === 'TEACHER'

  return (
    <div>
      <PageHeader
        eyebrow="Académico"
        title={isTeacher ? 'Libro de notas' : 'Mis notas'}
        description={
          isTeacher
            ? 'Revisa las notas por tarea, publícalas a los alumnos y corrige con motivo.'
            : 'Tus notas publicadas y los comentarios de tus docentes.'
        }
      />
      <CoursePicker
        filter={(course) => (isTeacher ? true : course.status === 'PUBLISHED')}
        emptyTitle="No hay cursos con notas"
        emptyDescription={
          isTeacher
            ? 'Crea un curso y publica tareas para armar el libro de notas.'
            : 'Cuando estés matriculado en un curso publicado, verás aquí tus notas.'
        }
      >
        {(course) =>
          isTeacher ? (
            <Gradebook key={course.courseId} course={course} />
          ) : (
            <MyGrades key={course.courseId} course={course} />
          )
        }
      </CoursePicker>
    </div>
  )
}

function MyGrades({ course }: { course: Course }) {
  const state = useApi(() => getMyGrades(course.courseId), [course.courseId])

  if (state.loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (state.error) {
    return <Alert>{state.error}</Alert>
  }

  const grades = state.data?.items ?? []
  if (grades.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="size-6" aria-hidden />}
        title="Todavía no tienes notas publicadas"
        description="Las notas aparecen aquí cuando tu docente las publica."
      />
    )
  }

  const avg = average(grades)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Promedio del curso
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {avg == null ? '—' : avg.toFixed(1)}
              <span className="text-base font-normal text-slate-400"> / 20</span>
            </p>
          </div>
          {avg == null ? null : (
            <Badge variant={avg >= 10.5 ? 'success' : 'danger'}>
              {avg >= 10.5 ? 'Aprobando' : 'En riesgo'}
            </Badge>
          )}
        </CardContent>
      </Card>
      {grades.map((grade) => (
        <MyGradeCard key={grade.gradeId} grade={grade} />
      ))}
    </div>
  )
}

function MyGradeCard({ grade }: { grade: Grade }) {
  // El comentario y la rúbrica viven en la entrega (ms-evaluaciones).
  const submissions = useApi(
    () =>
      grade.assignmentId
        ? listSubmissions(grade.assignmentId, { limit: 20 })
        : Promise.resolve(null),
    [grade.assignmentId],
  )
  const graded = (submissions.data?.items ?? [])
    .filter((item) => item.status === 'GRADED')
    .sort((left, right) => right.attempt - left.attempt)[0]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{grade.title ?? 'Evaluación'}</CardTitle>
          <p className="text-lg font-semibold text-slate-900">
            {formatScore(grade.score)}
            <span className="text-sm font-normal text-slate-400">
              {' '}
              / {formatScore(grade.maxScore)}
            </span>
          </p>
        </div>
        {grade.postedAt ? (
          <p className="text-xs text-slate-500">
            Publicada el {formatDateTime(grade.postedAt)}
          </p>
        ) : null}
      </CardHeader>
      {graded?.feedback ? (
        <CardContent>
          <FeedbackView feedback={graded.feedback} />
        </CardContent>
      ) : null}
    </Card>
  )
}

interface SelectedCell {
  grade: Grade
  gradeItem: GradeItem
}

function Gradebook({ course }: { course: Course }) {
  const state = useApi(() => getGradebook(course.courseId), [course.courseId])
  const [postingId, setPostingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'ok' } | null>(
    null,
  )
  const [selected, setSelected] = useState<SelectedCell | null>(null)

  // Nombres de los alumnos del libro de notas (GET /users/{id}, con caché).
  const nameOf = useUserNames((state.data?.rows ?? []).map((row) => row.studentId))

  async function handlePost(gradeItem: GradeItem) {
    setMessage(null)
    setPostingId(gradeItem.gradeItemId)
    try {
      const result = await postGradeItem(gradeItem.gradeItemId)
      setMessage({
        tone: 'ok',
        text:
          result.posted === 0
            ? `No había notas en borrador en ${gradeItem.title}.`
            : `Se publicaron ${result.posted} nota(s) de ${gradeItem.title}; los alumnos recibirán un aviso.`,
      })
      state.reload()
    } catch (cause) {
      setMessage({ tone: 'error', text: errorMessage(cause) })
    } finally {
      setPostingId(null)
    }
  }

  if (state.loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (state.error) {
    return <Alert>{state.error}</Alert>
  }

  const gradeItems = state.data?.gradeItems ?? []
  const rows = [...(state.data?.rows ?? [])].sort((left, right) =>
    nameOf(left.studentId).localeCompare(nameOf(right.studentId)),
  )

  if (gradeItems.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="size-6" aria-hidden />}
        title="El libro de notas está vacío"
        description="Cada tarea publicada agrega una columna. Publica una tarea en Evaluaciones."
      />
    )
  }

  const gradeFor = (studentId: string, gradeItemId: string) =>
    rows
      .find((row) => row.studentId === studentId)
      ?.grades.find((grade) => grade.gradeItemId === gradeItemId)
  const draftsIn = (gradeItemId: string) =>
    rows.filter((row) =>
      row.grades.some(
        (grade) => grade.gradeItemId === gradeItemId && grade.status === 'DRAFT',
      ),
    ).length

  return (
    <div className="space-y-4">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Alumno</th>
                  {gradeItems.map((item) => {
                    const drafts = draftsIn(item.gradeItemId)
                    return (
                      <th
                        key={item.gradeItemId}
                        className="px-4 py-3 align-top font-medium"
                      >
                        <p className="max-w-48 normal-case tracking-normal text-slate-700">
                          {item.title}
                        </p>
                        <p className="font-normal normal-case tracking-normal text-slate-400">
                          sobre {formatScore(item.maxScore)}
                        </p>
                        <Button
                          size="sm"
                          variant={drafts > 0 ? 'primary' : 'ghost'}
                          className="mt-2 h-7 px-2 text-xs normal-case tracking-normal"
                          disabled={drafts === 0}
                          loading={postingId === item.gradeItemId}
                          leftIcon={<Send className="size-3.5" aria-hidden />}
                          onClick={() => void handlePost(item)}
                        >
                          {drafts > 0 ? `Publicar ${drafts}` : 'Todo publicado'}
                        </Button>
                      </th>
                    )
                  })}
                  <th className="px-4 py-3 font-medium">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const avg = average(row.grades)
                  return (
                    <tr key={row.studentId}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {nameOf(row.studentId)}
                      </td>
                      {gradeItems.map((item) => {
                        const grade = gradeFor(row.studentId, item.gradeItemId)
                        return (
                          <td key={item.gradeItemId} className="px-4 py-3">
                            {grade ? (
                              <button
                                type="button"
                                onClick={() => setSelected({ grade, gradeItem: item })}
                                className="inline-flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100"
                                title="Corregir o ver historial"
                              >
                                <span className="font-semibold text-slate-900">
                                  {formatScore(grade.score)}
                                </span>
                                <Badge
                                  variant={
                                    grade.status === 'POSTED' ? 'success' : 'warning'
                                  }
                                >
                                  {grade.status === 'POSTED' ? 'Publicada' : 'Borrador'}
                                </Badge>
                              </button>
                            ) : (
                              <span className="px-2 text-slate-300">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {avg == null ? '—' : avg.toFixed(1)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-slate-500">
        Las notas se califican desde Evaluaciones → Ver entregas y quedan en borrador. El
        promedio es sobre 20 e incluye borradores.
      </p>

      <GradeOverrideModal
        grade={selected?.grade ?? null}
        gradeItem={selected?.gradeItem ?? null}
        studentName={selected ? nameOf(selected.grade.studentId) : ''}
        nameOf={nameOf}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null)
          state.reload()
        }}
      />
    </div>
  )
}
