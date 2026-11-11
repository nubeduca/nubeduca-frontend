import {
  ArrowRight,
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { navItemsForRole } from '@/components/layout/navigation'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import { useAuth } from '@/features/auth/auth-context'
import { ROLE_LABELS, TENANT_LABELS } from '@/lib/types'

const moduleDescriptions: Record<string, string> = {
  '/cursos': 'Catálogo, detalle y matrícula.',
  '/contenidos': 'Módulos, archivos y enlaces.',
  '/evaluaciones': 'Tareas, entregas y rúbricas.',
  '/calificaciones': 'Libro de notas y progreso.',
  '/notificaciones': 'Avisos y bandeja personal.',
  '/admin/usuarios': 'Perfiles y roles del tenant.',
}

const stats = [
  { label: 'Cursos', value: '—', icon: BookOpen },
  { label: 'Tareas', value: '—', icon: ClipboardList },
  { label: 'Notas', value: '—', icon: GraduationCap },
  { label: 'Avisos', value: '—', icon: Bell },
]

export function DashboardPage() {
  const { session } = useAuth()

  if (!session) {
    return null
  }

  const firstName = session.name.split(' ')[0] ?? session.name
  const quickLinks = navItemsForRole(session.role).filter((item) => item.to !== '/')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inicio"
        title={`Hola, ${firstName}`}
        description="Este es el shell del frontend. Todavía no hay datos reales: las pantallas de cada módulo se irán conectando a los contratos OpenAPI."
        actions={
          <Badge variant="brand">
            <Sparkles className="mr-1 size-3" aria-hidden />
            {TENANT_LABELS[session.tenantId]} · {ROLE_LABELS[session.role]}
          </Badge>
        }
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong className="font-semibold">Sesión simulada.</strong> El tenant y el rol se
        guardan en el navegador. En AUTH-01 pasarán a salir del token de Cognito.
      </div>

      <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Sin conectar</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" aria-hidden />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section aria-label="Módulos">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Módulos</h2>
          <p className="text-xs text-slate-400">
            Visibles según tu rol: {ROLE_LABELS[session.role]}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <ArrowRight
                    className="size-4 text-slate-300 transition-colors group-hover:text-brand-500"
                    aria-hidden
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {moduleDescriptions[item.to] ?? 'Módulo del LMS.'}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Estado del shell</CardTitle>
          <CardDescription>
            Lo que ya deja listo FE-01 para el resto del equipo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <li>✅ Layout con sidebar, topbar y menú por rol</li>
            <li>✅ Rutas por módulo y carpeta de pantallas</li>
            <li>✅ Design system base reutilizable</li>
            <li>✅ Login simulado con tenant y rol</li>
            <li>✅ Cliente de API con variables VITE_API_*</li>
            <li>⏳ Despliegue en AWS Amplify</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
