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
  Spinner,
} from '@/components/ui'
import { useAuth } from '@/features/auth/auth-context'
import { getGradebook, getMyGrades } from '@/lib/api/calificaciones'
import { listCourses } from '@/lib/api/cursos'
import { listAssignments } from '@/lib/api/evaluaciones'
import { listMyNotifications } from '@/lib/api/notificaciones'
import type { CourseStatus } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/useApi'
import { ROLE_LABELS, TENANT_LABELS, type Session } from '@/lib/types'

const moduleDescriptions: Record<string, string> = {
  '/cursos': 'Catálogo, detalle y matrícula.',
  '/contenidos': 'Módulos, archivos y enlaces.',
  '/evaluaciones': 'Tareas, entregas y rúbricas.',
  '/calificaciones': 'Libro de notas y progreso.',
  '/notificaciones': 'Avisos y bandeja personal.',
  '/admin/usuarios': 'Perfiles y roles del tenant.',
}

interface Stat {
  label: string
  value: string
  hint: string
  icon: typeof BookOpen
}

function countLabel(page: { items: unknown[]; nextToken: string | null } | null): string {
  if (!page) {
    return '—'
  }
  return page.nextToken ? `${page.items.length}+` : String(page.items.length)
}

const STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
}

const STATUS_VARIANTS: Record<CourseStatus, 'success' | 'warning' | 'neutral'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
}

interface AcademicSummary {
  assignments: number
  drafts: number
  grades: number
}

/**
 * Resumen de tareas y notas recorriendo los cursos visibles (como mucho 10).
 * El docente cuenta notas en borrador; el alumno, sus notas publicadas.
 */
async function loadAcademicSummary(
  session: Session | null,
): Promise<AcademicSummary | null> {
  if (!session || session.role === 'ADMIN') {
    return null
  }
  const { items } = await listCourses({ limit: 100 })
  const courses = items.filter((course) => course.status !== 'ARCHIVED').slice(0, 10)
  const isTeacher = session.role === 'TEACHER'

  const perCourse = await Promise.all(
    courses.map(async (course) => {
      const [assignments, grades] = await Promise.all([
        listAssignments(course.courseId, { limit: 100 }),
        isTeacher
          ? getGradebook(course.courseId).then(
              (book) =>
                book.rows
                  .flatMap((row) => row.grades)
                  .filter((grade) => grade.status === 'DRAFT').length,
            )
          : course.status === 'PUBLISHED'
            ? getMyGrades(course.courseId).then((list) => list.items.length)
            : Promise.resolve(0),
      ])
      return {
        assignments: assignments.items.length,
        drafts: assignments.items.filter((item) => item.status === 'DRAFT').length,
        grades,
      }
    }),
  )

  return perCourse.reduce(
    (total, item) => ({
      assignments: total.assignments + item.assignments,
      drafts: total.drafts + item.drafts,
      grades: total.grades + item.grades,
    }),
    { assignments: 0, drafts: 0, grades: 0 },
  )
}

export function DashboardPage() {
  const { session, mode } = useAuth()
  const coursesState = useApi(() => listCourses({ limit: 100 }), [session?.userId])
  const academicState = useApi(() => loadAcademicSummary(session), [session?.userId])
  const notificationsState = useApi(
    () => listMyNotifications({ limit: 100 }),
    [session?.userId],
  )

  if (!session) {
    return null
  }

  const firstName = session.name.split(' ')[0] ?? session.name
  const quickLinks = navItemsForRole(session.role).filter((item) => item.to !== '/')
  const courses = coursesState.data?.items ?? []
  const isTeacher = session.role === 'TEACHER'

  const stats: Stat[] = [
    {
      label: isTeacher
        ? 'Cursos a cargo'
        : session.role === 'ADMIN'
          ? 'Cursos'
          : 'Mis cursos',
      value: coursesState.loading ? '…' : countLabel(coursesState.data),
      hint: coursesState.error ? 'Sin conexión' : 'ms-cursos',
      icon: BookOpen,
    },
    {
      label: 'Tareas',
      value: academicState.loading ? '…' : String(academicState.data?.assignments ?? '—'),
      hint: academicState.error
        ? 'Sin conexión'
        : isTeacher
          ? `${academicState.data?.drafts ?? 0} en borrador`
          : 'Publicadas en tus cursos',
      icon: ClipboardList,
    },
    {
      label: isTeacher ? 'Notas por publicar' : 'Notas',
      value: academicState.loading ? '…' : String(academicState.data?.grades ?? '—'),
      hint: academicState.error
        ? 'Sin conexión'
        : isTeacher
          ? 'Borradores en el libro de notas'
          : 'Publicadas por tus docentes',
      icon: GraduationCap,
    },
    {
      label: 'Avisos',
      value: notificationsState.loading ? '…' : countLabel(notificationsState.data),
      hint: notificationsState.error ? 'Sin conexión' : 'ms-notificaciones',
      icon: Bell,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inicio"
        title={`Hola, ${firstName}`}
        description={
          isTeacher
            ? 'Gestiona tus cursos, matrículas y contenidos desde aquí.'
            : session.role === 'ADMIN'
              ? 'Resumen académico de tu institución.'
              : 'Tus cursos, materiales y avisos en un solo lugar.'
        }
        actions={
          <Badge variant="brand">
            <Sparkles className="mr-1 size-3" aria-hidden />
            {TENANT_LABELS[session.tenantId]} · {ROLE_LABELS[session.role]}
          </Badge>
        }
      />

      {mode === 'mock' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong className="font-semibold">Modo demo.</strong> La sesión es simulada y
          los datos son de prueba. Con Cognito (AUTH-01) el tenant y el rol salen del
          token.
        </div>
      ) : null}

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
                  <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" aria-hidden />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{isTeacher ? 'Cursos a tu cargo' : 'Mis cursos'}</CardTitle>
          <CardDescription>
            {isTeacher
              ? 'Incluye borradores; publícalos para que los alumnos los vean.'
              : 'Cursos publicados en los que estás matriculado.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coursesState.loading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : coursesState.error ? (
            <p className="text-sm text-rose-700">{coursesState.error}</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-slate-500">
              {isTeacher
                ? 'Todavía no tienes cursos. Créalos desde Cursos.'
                : 'Todavía no estás matriculado en ningún curso publicado.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {courses.slice(0, 5).map((course) => (
                <li key={course.courseId}>
                  <Link
                    to={`/cursos/${course.courseId}`}
                    className="group flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 group-hover:text-brand-700">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-500">{course.code}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={STATUS_VARIANTS[course.status]}>
                        {STATUS_LABELS[course.status]}
                      </Badge>
                      <ArrowRight
                        className="size-4 text-slate-300 group-hover:text-brand-500"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {courses.length > 5 ? (
            <Link
              to="/cursos"
              className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver los {countLabel(coursesState.data)} cursos
            </Link>
          ) : null}
        </CardContent>
      </Card>

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
    </div>
  )
}
