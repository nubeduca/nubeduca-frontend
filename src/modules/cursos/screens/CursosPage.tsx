import { BookOpen } from 'lucide-react'
import { ModulePlaceholder } from '@/components/layout/ModulePlaceholder'

export function CursosPage() {
  return (
    <ModulePlaceholder
      title="Cursos"
      description="Catálogo de cursos, detalle, matrícula y gestión para docentes."
      icon={<BookOpen className="size-6" aria-hidden />}
      emptyTitle="Todavía no hay cursos cargados"
      emptyDescription="La UI académica se conectará a los contratos OpenAPI de ms-cursos con datos mock."
      task="FE-02"
    />
  )
}
