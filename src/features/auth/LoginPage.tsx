import {
  ArrowRight,
  BookOpen,
  Cloud,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Badge, Button, Input, Select } from '@/components/ui'
import { useAuth } from '@/features/auth/auth-context'
import { ROLES, ROLE_LABELS, TENANTS, type Role, type TenantId } from '@/lib/types'

function suggestedEmail(tenantId: TenantId, role: Role): string {
  const tenant = tenantId.toLowerCase()
  if (role === 'STUDENT') {
    return `alumno.demo@${tenant}.edu.pe`
  }
  if (role === 'TEACHER') {
    return `docente.demo@${tenant}.edu.pe`
  }
  return `admin@${tenant}.edu.pe`
}

const tenantOptions = TENANTS.map((tenant) => ({
  value: tenant.id,
  label: tenant.label,
}))

const roleOptions = ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}))

export function LoginPage() {
  const { login, mode } = useAuth()
  const isMock = mode === 'mock'
  const navigate = useNavigate()
  const location = useLocation()

  const [tenantId, setTenantId] = useState<TenantId>('utec')
  const [role, setRole] = useState<Role>('TEACHER')
  const [emailOverride, setEmailOverride] = useState<string | null>(null)
  const [password, setPassword] = useState(isMock ? 'demo1234' : '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const email = emailOverride ?? suggestedEmail(tenantId, role)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Escribe un correo válido.')
      return
    }

    if (password.trim().length === 0) {
      setError(
        isMock
          ? 'Escribe cualquier contraseña (el login es simulado).'
          : 'Escribe tu contraseña.',
      )
      return
    }

    setSubmitting(true)
    try {
      await login({ tenantId, role, email: email.trim().toLowerCase(), password })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.')
      setSubmitting(false)
      return
    }

    const state = location.state as { from?: string } | null
    navigate(state?.from ?? '/', { replace: true })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,158,244,0.35),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(29,107,214,0.35),_transparent_50%)]"
          aria-hidden
        />
        <div className="relative space-y-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Cloud className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-semibold">Nubeduca</p>
              <p className="text-sm text-slate-300">
                Tu institución educativa, en la nube.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Badge variant="brand" className="bg-white/10 text-brand-100 ring-white/20">
              <Sparkles className="mr-1 size-3" aria-hidden />
              {isMock ? 'Modo demo' : 'Acceso institucional'}
            </Badge>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight">
              Un LMS multi-tenant para UTEC, UPC y PUCP.
            </h1>
            <p className="max-w-md text-slate-300">
              Cursos, contenidos, evaluaciones, calificaciones y avisos en una sola
              plataforma serverless.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <BookOpen className="size-4 text-brand-300" aria-hidden />
              Cada tenant con sus datos completamente aislados.
            </li>
            <li className="flex items-center gap-3">
              <GraduationCap className="size-4 text-brand-300" aria-hidden />
              Experiencias distintas para docentes y estudiantes.
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-brand-300" aria-hidden />
              Tu institución y tu rol salen de tu cuenta, no del formulario.
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">
          {isMock
            ? 'Modo demo · El login es simulado hasta completar AUTH-01.'
            : 'Inicio de sesión con Amazon Cognito.'}
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Cloud className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">Nubeduca</p>
              <p className="text-xs text-slate-500">
                Tu institución educativa, en la nube.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Iniciar sesión
            </h2>
            <p className="text-sm text-slate-500">
              {isMock
                ? 'Elige tu institución y tu rol para entrar.'
                : 'Elige tu institución y entra con tu correo institucional.'}
            </p>
          </div>

          {isMock ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong className="font-semibold">Login simulado.</strong> No valida
              credenciales reales; se reemplazará por Cognito en AUTH-01.
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={(event) => void handleSubmit(event)}
            noValidate
          >
            <Select
              label="Institución"
              options={tenantOptions}
              value={tenantId}
              onChange={(event) => {
                setTenantId(event.target.value as TenantId)
                setEmailOverride(null)
              }}
            />
            {isMock ? (
              <Select
                label="Rol"
                options={roleOptions}
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as Role)
                  setEmailOverride(null)
                }}
              />
            ) : null}
            <Input
              label="Correo institucional"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmailOverride(event.target.value)}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              hint={isMock ? 'Cualquier valor sirve en este login simulado.' : undefined}
              error={error ?? undefined}
            />
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              rightIcon={<ArrowRight className="size-4" aria-hidden />}
            >
              Entrar a Nubeduca
            </Button>
          </form>

          <div
            className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500"
            hidden={!isMock}
          >
            <p className="font-medium text-slate-700">Usuarios de demo</p>
            <p className="mt-1">Docente: docente.demo@utec.edu.pe</p>
            <p>Estudiante: alumno.demo@utec.edu.pe</p>
            <p className="mt-2 text-slate-400">
              Cambia la institución para entrar como UTEC, UPC o PUCP.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
