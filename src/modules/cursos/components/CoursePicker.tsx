import { BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Card, CardContent, EmptyState, Select, Spinner } from '@/components/ui'
import { listCourses } from '@/lib/api/cursos'
import type { Course } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/useApi'

export interface CoursePickerProps {
  /** Contenido para el curso elegido. */
  children: (course: Course) => ReactNode
  emptyTitle: string
  emptyDescription: string
  /** Filtra los cursos que tiene sentido mostrar (por ejemplo, solo publicados). */
  filter?: (course: Course) => boolean
}

/**
 * Selector de curso compartido por Evaluaciones y Calificaciones.
 * El curso elegido vive en `?curso=` para poder enlazar desde el detalle del curso.
 */
export function CoursePicker({
  children,
  emptyTitle,
  emptyDescription,
  filter,
}: CoursePickerProps) {
  const coursesState = useApi(() => listCourses({ limit: 100 }), [])
  const [searchParams, setSearchParams] = useSearchParams()

  if (coursesState.loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (coursesState.error) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {coursesState.error}
      </p>
    )
  }

  const courses = (coursesState.data?.items ?? []).filter(filter ?? (() => true))
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="size-6" aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  const requested = searchParams.get('curso')
  const selected = courses.find((course) => course.courseId === requested) ?? courses[0]
  if (!selected) {
    return null
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Select
            label="Curso"
            options={courses.map((course) => ({
              value: course.courseId,
              label: `${course.code} · ${course.title}`,
            }))}
            value={selected.courseId}
            onChange={(event) =>
              setSearchParams({ curso: event.target.value }, { replace: true })
            }
          />
          <div className="pb-1">
            <Badge variant="brand">{selected.code}</Badge>
          </div>
        </CardContent>
      </Card>
      {children(selected)}
    </div>
  )
}
