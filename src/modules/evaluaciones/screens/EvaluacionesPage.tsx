import { ClipboardList } from 'lucide-react'
import { ModulePlaceholder } from '@/components/layout/ModulePlaceholder'

export function EvaluacionesPage() {
  return (
    <ModulePlaceholder
      title="Evaluaciones"
      description="Tareas, entregas, rúbricas y fechas límite."
      icon={<ClipboardList className="size-6" aria-hidden />}
      emptyTitle="Todavía no hay evaluaciones cargadas"
      emptyDescription="La creación y entrega de tareas se conectará a ms-evaluaciones en FE-03."
      task="FE-03"
    />
  )
}
