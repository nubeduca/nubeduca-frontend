import {
  Archive,
  ChevronLeft,
  ClipboardList,
  GraduationCap,
  Pencil,
  Send,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Modal,
  Spinner,
} from '@/components/ui'
import { useAuth } from '@/features/auth/auth-context'
import { ApiError } from '@/lib/api/client'
import { archiveCourse, getCourse, publishCourse, updateCourse } from '@/lib/api/cursos'
import type { Course } from '@/lib/api/types'
import { listTerms } from '@/lib/api/usuarios'
import { useApi } from '@/lib/hooks/useApi'
import { EnrollmentPanel } from '../components/EnrollmentPanel'
import { CourseModules } from '../components/CourseModules'

const STATUS_LABELS: Record<Course['status'], string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
}

const STATUS_VARIANTS: Record<Course['status'], 'success' | 'warning' | 'neutral'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
}

function messageFromError(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : 'No se pudo completar la operación.'
}

export function CursoDetallePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { session } = useAuth()
  const courseState = useApi<Course | null>(() => {
    if (!courseId) {
      return Promise.resolve(null)
    }
    return getCourse(courseId)
  }, [courseId])
  const termsState = useApi(() => listTerms({ limit: 100 }), [])

  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<'publish' | 'archive' | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  if (!session) {
    return null
  }

  const course = courseState.data
  const terms = termsState.data?.items ?? []
  const termName = course
    ? terms.find((term) => term.termId === course.termId)?.name
    : undefined
  const canManageCourse =
    course !== null &&
    (session.role === 'ADMIN' ||
      (session.role === 'TEACHER' && course.ownerId === session.userId))
  const canManageModules =
    course !== null && session.role === 'TEACHER' && course.ownerId === session.userId

  function openEdit() {
    if (!course) {
      return
    }
    setEditForm({
      title: course.title,
      description: course.description ?? '',
    })
    setEditError(null)
    setEditOpen(true)
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!course) {
      return
    }
    setEditError(null)

    if (editForm.title.trim().length === 0) {
      setEditError('El título es obligatorio.')
      return
    }

    setEditSaving(true)
    try {
      await updateCourse(course.courseId, {
        title: editForm.title.trim(),
        description: editForm.description,
      })
      setEditOpen(false)
      courseState.reload()
    } catch (cause) {
      setEditError(messageFromError(cause))
    } finally {
      setEditSaving(false)
    }
  }

  async function handlePublish() {
    if (!course) {
      return
    }
    setActionError(null)
    setActionLoading('publish')
    try {
      await publishCourse(course.courseId)
      courseState.reload()
    } catch (cause) {
      setActionError(messageFromError(cause))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleArchive() {
    if (!course) {
      return
    }
    setActionError(null)
    setActionLoading('archive')
    try {
      await archiveCourse(course.courseId)
      courseState.reload()
    } catch (cause) {
      setActionError(messageFromError(cause))
    } finally {
      setActionLoading(null)
    }
  }

  if (!courseId) {
    return (
      <EmptyState
        title="Curso no encontrado"
        description="La URL no incluye un identificador de curso."
      />
    )
  }

  if (courseState.loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (courseState.error || !course) {
    return (
      <div>
        <Link
          to="/cursos"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Volver a cursos
        </Link>
        <EmptyState
          title="No se pudo cargar el curso"
          description={courseState.error ?? 'El curso no existe en este tenant.'}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/cursos"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Volver a cursos
        </Link>
        <PageHeader
          eyebrow={`Curso · ${course.code}`}
          title={course.title}
          description={course.description || 'Sin descripción.'}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANTS[course.status]}>
                {STATUS_LABELS[course.status]}
              </Badge>
              {canManageCourse ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Pencil className="size-4" aria-hidden />}
                    onClick={openEdit}
                  >
                    Editar
                  </Button>
                  {course.status === 'DRAFT' ? (
                    <Button
                      size="sm"
                      loading={actionLoading === 'publish'}
                      leftIcon={<Send className="size-4" aria-hidden />}
                      onClick={handlePublish}
                    >
                      Publicar
                    </Button>
                  ) : null}
                  {course.status !== 'ARCHIVED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={actionLoading === 'archive'}
                      leftIcon={<Archive className="size-4" aria-hidden />}
                      onClick={handleArchive}
                    >
                      Archivar
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          }
        />
      </div>

      <Card>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Periodo
            </p>
            <p className="mt-1 font-medium text-slate-900">{termName ?? course.termId}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Código
            </p>
            <p className="mt-1 font-medium text-slate-900">{course.code}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Docente responsable
            </p>
            <p className="mt-1 break-all font-medium text-slate-900">{course.ownerId}</p>
          </div>
        </CardContent>
      </Card>

      {course.status !== 'ARCHIVED' ? (
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/evaluaciones?curso=${course.courseId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-brand-200 hover:text-brand-700"
          >
            <ClipboardList className="size-4" aria-hidden />
            Evaluaciones del curso
          </Link>
          {session.role !== 'ADMIN' ? (
            <Link
              to={`/calificaciones?curso=${course.courseId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-brand-200 hover:text-brand-700"
            >
              <GraduationCap className="size-4" aria-hidden />
              {session.role === 'TEACHER' ? 'Libro de notas' : 'Mis notas'}
            </Link>
          ) : null}
        </div>
      ) : null}

      {actionError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </p>
      ) : null}

      <CourseModules courseId={course.courseId} canManage={canManageModules} />

      {canManageCourse ? <EnrollmentPanel courseId={course.courseId} /> : null}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar curso"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-course-form" loading={editSaving}>
              Guardar
            </Button>
          </>
        }
      >
        <form id="edit-course-form" className="space-y-4" onSubmit={handleUpdate}>
          <Input
            label="Título"
            value={editForm.title}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, title: event.target.value }))
            }
          />
          <div className="space-y-1.5">
            <label
              htmlFor="edit-description"
              className="block text-sm font-medium text-slate-700"
            >
              Descripción
            </label>
            <textarea
              id="edit-description"
              rows={4}
              value={editForm.description}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {editError ? <p className="text-sm text-rose-600">{editError}</p> : null}
        </form>
      </Modal>
    </div>
  )
}
