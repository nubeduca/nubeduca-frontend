import { Bell, Save } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
} from '@/components/ui'
import { ApiError } from '@/lib/api/client'
import {
  getMyPreferences,
  listMyNotifications,
  putMyPreferences,
} from '@/lib/api/notificaciones'
import type { NotificationStatus, NotificationType, Preferences } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/useApi'
import { usePaginated } from '@/lib/hooks/usePaginated'

const TYPE_LABELS: Record<NotificationType, string> = {
  COURSE_PUBLISHED: 'Curso publicado',
  ANNOUNCEMENT: 'Anuncio',
  MODULE: 'Módulo',
  ASSIGNMENT: 'Tarea',
  SUBMISSION_RECEIPT: 'Entrega recibida',
  GRADE: 'Nota',
}

const STATUS_META: Record<
  NotificationStatus,
  { label: string; variant: 'success' | 'danger' | 'warning' }
> = {
  SENT: { label: 'Enviado', variant: 'success' },
  FAILED: { label: 'Falló', variant: 'danger' },
  SKIPPED_BY_PREFERENCE: { label: 'Omitido por preferencia', variant: 'warning' },
}

const PREFERENCE_ITEMS: Array<{
  key: keyof Preferences['email']
  label: string
  description: string
}> = [
  {
    key: 'coursePublished',
    label: 'Cursos publicados',
    description: 'Avisos cuando se publica un curso en el que estás matriculado.',
  },
  {
    key: 'announcements',
    label: 'Anuncios',
    description: 'Anuncios publicados por el docente en tus cursos.',
  },
  {
    key: 'modules',
    label: 'Módulos',
    description: 'Nuevos módulos de contenido disponibles.',
  },
  {
    key: 'assignments',
    label: 'Tareas',
    description: 'Tareas y evaluaciones publicadas.',
  },
  {
    key: 'submissionReceipts',
    label: 'Entregas',
    description: 'Confirmaciones de entregas recibidas.',
  },
  {
    key: 'grades',
    label: 'Notas',
    description: 'Notas publicadas o modificadas.',
  },
]

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function messageFromError(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : 'No se pudo completar la operación.'
}

export function NotificacionesPage() {
  const notifications = usePaginated(
    (nextToken) => listMyNotifications({ limit: 20, nextToken }),
    [],
  )
  const preferencesState = useApi(() => getMyPreferences(), [])
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const current = preferences ?? preferencesState.data

  function togglePreference(key: keyof Preferences['email']) {
    setSaved(false)
    setPreferences((state) => {
      const base = state ?? preferencesState.data
      if (!base) {
        return state
      }
      return {
        email: {
          ...base.email,
          [key]: !base.email[key],
        },
      }
    })
  }

  async function handleSave() {
    if (!current) {
      return
    }
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const updated = await putMyPreferences(current)
      setPreferences(updated)
      setSaved(true)
    } catch (cause) {
      setSaveError(messageFromError(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Avisos"
        title="Notificaciones"
        description="Bandeja personal de avisos por email y preferencias de notificación."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Bandeja de avisos</CardTitle>
            <CardDescription>
              Más recientes primero. Los avisos omitidos no se enviaron por tus
              preferencias.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {notifications.loading ? (
              <div className="flex min-h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : notifications.error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {notifications.error}
              </p>
            ) : notifications.items.length === 0 ? (
              <EmptyState
                icon={<Bell className="size-6" aria-hidden />}
                title="No tienes notificaciones todavía"
                description="Cuando se publique un curso o un módulo recibirás un aviso aquí."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.items.map((notification) => {
                  const status = STATUS_META[notification.status]
                  return (
                    <li key={notification.notificationId} className="py-3 first:pt-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="brand">
                              {TYPE_LABELS[notification.type]}
                            </Badge>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <p className="text-sm font-medium text-slate-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(notification.createdAt)}
                            {notification.courseId ? ` · ${notification.courseId}` : ''}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
          {notifications.nextToken ? (
            <CardFooter>
              <Button
                variant="outline"
                loading={notifications.loadingMore}
                onClick={notifications.loadMore}
              >
                Cargar más
              </Button>
            </CardFooter>
          ) : null}
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Preferencias de email</CardTitle>
            <CardDescription>
              Elige qué avisos quieres recibir. El servicio respeta estas preferencias al
              enviar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {preferencesState.loading || !current ? (
              <div className="flex min-h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : preferencesState.error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {preferencesState.error}
              </p>
            ) : (
              <ul className="space-y-3">
                {PREFERENCE_ITEMS.map((item) => (
                  <li key={item.key} className="flex items-start gap-3">
                    <input
                      id={`preference-${item.key}`}
                      type="checkbox"
                      checked={current.email[item.key]}
                      onChange={() => togglePreference(item.key)}
                      className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label
                      htmlFor={`preference-${item.key}`}
                      className="space-y-0.5 text-sm"
                    >
                      <span className="block font-medium text-slate-900">
                        {item.label}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {item.description}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-2">
            <div className="text-xs">
              {saveError ? (
                <span className="text-rose-600">{saveError}</span>
              ) : saved ? (
                <span className="text-emerald-700">Preferencias guardadas.</span>
              ) : null}
            </div>
            <Button
              leftIcon={<Save className="size-4" aria-hidden />}
              loading={saving}
              disabled={!current || preferencesState.loading}
              onClick={handleSave}
            >
              Guardar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
