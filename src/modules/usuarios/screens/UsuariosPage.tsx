import { Users } from 'lucide-react'
import { ModulePlaceholder } from '@/components/layout/ModulePlaceholder'

export function UsuariosPage() {
  return (
    <ModulePlaceholder
      title="Usuarios"
      description="Administración de usuarios del tenant: perfiles y roles."
      icon={<Users className="size-6" aria-hidden />}
      emptyTitle="Administración de usuarios en construcción"
      emptyDescription="Esta pantalla es solo para ADMIN y se conectará a ms-usuarios cuando exista el contrato de listado."
      task="ACA-02"
    />
  )
}
