import { GraduationCap } from 'lucide-react'
import { ModulePlaceholder } from '@/components/layout/ModulePlaceholder'

export function CalificacionesPage() {
  return (
    <ModulePlaceholder
      title="Calificaciones"
      description="Libro de notas, mis notas, historial y ajustes del docente."
      icon={<GraduationCap className="size-6" aria-hidden />}
      emptyTitle="Todavía no hay notas publicadas"
      emptyDescription="El libro de notas y las notas del alumno se conectarán a ms-calificaciones en FE-03."
      task="FE-03"
    />
  )
}
