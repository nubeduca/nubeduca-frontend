import { FolderOpen } from 'lucide-react'
import { ModulePlaceholder } from '@/components/layout/ModulePlaceholder'

export function ContenidosPage() {
  return (
    <ModulePlaceholder
      title="Contenidos"
      description="Módulos, páginas, archivos y enlaces de cada curso."
      icon={<FolderOpen className="size-6" aria-hidden />}
      emptyTitle="Todavía no hay contenidos cargados"
      emptyDescription="La subida de archivos y los módulos se conectarán a ms-contenidos con datos mock."
      task="CON-02"
    />
  )
}
