import { BookOpen, ChevronLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui'

export function CursoDetallePage() {
  const { courseId } = useParams<{ courseId: string }>()

  return (
    <div>
      <Link
        to="/cursos"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Volver a cursos
      </Link>
      <PageHeader
        title={`Curso ${courseId ?? ''}`}
        description="Detalle del curso, secciones, contenidos y matrícula."
        eyebrow="Módulo · Cursos"
      />
      <EmptyState
        icon={<BookOpen className="size-6" aria-hidden />}
        title="Detalle del curso en construcción"
        description="Esta pantalla se completará en FE-02 contra GET /courses/{courseId}."
      />
    </div>
  )
}
