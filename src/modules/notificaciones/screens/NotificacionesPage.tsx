import { Bell } from 'lucide-react'
import { ModulePlaceholder } from '@/components/layout/ModulePlaceholder'

export function NotificacionesPage() {
  return (
    <ModulePlaceholder
      title="Notificaciones"
      description="Avisos por email y bandeja de notificaciones del usuario."
      icon={<Bell className="size-6" aria-hidden />}
      emptyTitle="No tienes notificaciones todavía"
      emptyDescription="La bandeja real llegará con ms-notificaciones y las preferencias del usuario en ENG-01."
      task="ENG-01"
    />
  )
}
