import { FolderOpen } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Card, CardContent, EmptyState, Select, Spinner } from '@/components/ui'
import { useAuth } from '@/features/auth/auth-context'
import { listCourses } from '@/lib/api/cursos'
import { useApi } from '@/lib/hooks/useApi'
import { CourseModules } from '@/modules/cursos/components/CourseModules'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
}

export function ContenidosPage() {
  const { session } = useAuth()
  const coursesState = useApi(() => listCourses({ limit: 100 }), [])
  const [courseId, setCourseId] = useState('')

  if (!session) {
    return null
  }

  const courses = coursesState.data?.items ?? []
  const selectedId = courseId || courses[0]?.courseId || ''
  const selectedCourse = courses.find((course) => course.courseId === selectedId)
  const canManageModules = Boolean(
    selectedCourse &&
    session.role === 'TEACHER' &&
    selectedCourse.ownerId === session.userId,
  )
  const courseOptions = courses.map((course) => ({
    value: course.courseId,
    label: `${course.code} · ${course.title}`,
  }))

  return (
    <div>
      <PageHeader
        eyebrow="Académico"
        title="Contenidos"
        description="Módulos, páginas y enlaces de los cursos a los que tienes acceso."
      />

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
          icon={<FolderOpen className="size-6" aria-hidden />}
          title="No hay cursos con contenido"
          description="Cuando tengas cursos publicados o asignados, aparecerán aquí sus módulos."
        />
      ) : (
        <div className="space-y-5">
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Select
                label="Curso"
                options={courseOptions}
                value={selectedId}
                onChange={(event) => setCourseId(event.target.value)}
              />
              {selectedCourse ? (
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <Badge variant="brand">{selectedCourse.code}</Badge>
                  <Badge
                    variant={
                      selectedCourse.status === 'PUBLISHED'
                        ? 'success'
                        : selectedCourse.status === 'DRAFT'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {STATUS_LABELS[selectedCourse.status] ?? selectedCourse.status}
                  </Badge>
                  <Link
                    to={`/cursos/${selectedCourse.courseId}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Ver detalle del curso
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {selectedCourse ? (
            <CourseModules
              courseId={selectedCourse.courseId}
              canManage={canManageModules}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
