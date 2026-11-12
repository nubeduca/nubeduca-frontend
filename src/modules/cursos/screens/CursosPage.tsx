import { ArrowRight, BookOpen, Plus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Modal,
  Select,
  Spinner,
} from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/features/auth/auth-context'
import { ApiError } from '@/lib/api/client'
import { createCourse, listCourses } from '@/lib/api/cursos'
import type { Course, CourseStatus } from '@/lib/api/types'
import { listTerms } from '@/lib/api/usuarios'
import { useApi } from '@/lib/hooks/useApi'

const STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
}

const STATUS_VARIANTS: Record<CourseStatus, 'success' | 'warning' | 'neutral'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'ARCHIVED', label: 'Archivado' },
]

interface CourseForm {
  termId: string
  code: string
  title: string
  description: string
}

function messageFromError(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : 'No se pudo completar la operación.'
}

export function CursosPage() {
  const { session } = useAuth()
  const [termId, setTermId] = useState('')
  const [status, setStatus] = useState<CourseStatus | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<CourseForm>({
    termId: '',
    code: '',
    title: '',
    description: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSaving, setFormSaving] = useState(false)

  const termsState = useApi(() => listTerms({ limit: 100 }), [])
  const coursesState = useApi(
    () =>
      listCourses({
        termId: termId || undefined,
        status: status || undefined,
        limit: 100,
      }),
    [termId, status],
  )

  if (!session) {
    return null
  }

  const isManager = session.role === 'TEACHER' || session.role === 'ADMIN'
  const terms = termsState.data?.items ?? []
  const courses = coursesState.data?.items ?? []
  const termById = new Map(terms.map((term) => [term.termId, term]))
  const activeTerm = terms.find((term) => term.status === 'ACTIVE') ?? terms[0]
  const termOptions = [
    { value: '', label: 'Todos los periodos' },
    ...terms.map((term) => ({ value: term.termId, label: term.name })),
  ]

  function openForm() {
    setForm({
      termId: activeTerm?.termId ?? '',
      code: '',
      title: '',
      description: '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!form.termId || form.code.trim().length === 0 || form.title.trim().length === 0) {
      setFormError('El periodo, código y título son obligatorios.')
      return
    }

    setFormSaving(true)
    try {
      await createCourse({
        termId: form.termId,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
      })
      setFormOpen(false)
      coursesState.reload()
    } catch (cause) {
      setFormError(messageFromError(cause))
    } finally {
      setFormSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Académico"
        title="Cursos"
        description={
          session.role === 'STUDENT'
            ? 'Cursos publicados en los que estás matriculado.'
            : 'Cursos del tenant, matrículas y contenido.'
        }
        actions={
          isManager ? (
            <Button leftIcon={<Plus className="size-4" aria-hidden />} onClick={openForm}>
              Nuevo curso
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-5">
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Periodo"
            options={termOptions}
            value={termId}
            onChange={(event) => setTermId(event.target.value)}
          />
          {isManager ? (
            <Select
              label="Estado"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(event) => setStatus(event.target.value as CourseStatus | '')}
            />
          ) : null}
        </CardContent>
      </Card>

      {coursesState.loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : coursesState.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {coursesState.error}
        </p>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-6" aria-hidden />}
          title="No hay cursos para mostrar"
          description={
            isManager
              ? 'Crea un curso en un periodo activo o cambia los filtros.'
              : 'El docente todavía no ha publicado cursos en tu periodo.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.courseId}
              course={course}
              termName={termById.get(course.termId)?.name}
            />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nuevo curso"
        description="El curso se crea en borrador. Publícalo desde el detalle cuando esté listo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="course-form" loading={formSaving}>
              Crear curso
            </Button>
          </>
        }
      >
        <form id="course-form" className="space-y-4" onSubmit={handleCreate}>
          <Select
            label="Periodo"
            options={termOptions.slice(1)}
            value={form.termId}
            onChange={(event) =>
              setForm((current) => ({ ...current, termId: event.target.value }))
            }
            hint="Solo los periodos activos permiten crear cursos."
          />
          <Input
            label="Código"
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({ ...current, code: event.target.value }))
            }
            placeholder="CS2032"
            hint="Dos a veinte caracteres: letras mayúsculas, números o guiones."
          />
          <Input
            label="Título"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Cloud Computing"
          />
          <div className="space-y-1.5">
            <label
              htmlFor="course-description"
              className="block text-sm font-medium text-slate-700"
            >
              Descripción
            </label>
            <textarea
              id="course-description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Descripción breve del curso"
            />
          </div>
          {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
        </form>
      </Modal>
    </div>
  )
}

function CourseCard({ course, termName }: { course: Course; termName?: string }) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="brand">{course.code}</Badge>
          <Badge variant={STATUS_VARIANTS[course.status]}>
            {STATUS_LABELS[course.status]}
          </Badge>
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-base font-semibold text-slate-900">{course.title}</h3>
          <p className="text-sm text-slate-500">
            {course.description || 'Sin descripción.'}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>{termName ?? 'Periodo sin nombre'}</span>
          <Link
            to={`/cursos/${course.courseId}`}
            className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
          >
            Ver curso
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
