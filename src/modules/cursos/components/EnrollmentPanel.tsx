import { Plus, Search, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui'
import { ApiError } from '@/lib/api/client'
import {
  createEnrollment,
  dropEnrollment,
  importEnrollments,
  listEnrollments,
  listSections,
} from '@/lib/api/cursos'
import type { ImportResult, User } from '@/lib/api/types'
import { listUsers } from '@/lib/api/usuarios'
import { useApi } from '@/lib/hooks/useApi'
import { rememberUsers, useUsers } from '@/lib/hooks/useUsers'

export interface EnrollmentPanelProps {
  courseId: string
}

interface EnrollmentForm {
  userId: string
  role: 'STUDENT' | 'TEACHER'
  sectionId: string
}

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Estudiante' },
  { value: 'TEACHER', label: 'Docente' },
]

const INITIAL_CSV = 'institutionalCode,role,section\n'

function messageFromError(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : 'No se pudo completar la operación.'
}

export function EnrollmentPanel({ courseId }: EnrollmentPanelProps) {
  const usersState = useApi(() => listUsers({ limit: 100 }), [courseId])
  const sectionsState = useApi(() => listSections(courseId), [courseId])
  const enrollmentsState = useApi(
    () => listEnrollments(courseId, { limit: 100 }),
    [courseId],
  )

  const [form, setForm] = useState<EnrollmentForm>({
    userId: '',
    role: 'STUDENT',
    sectionId: '',
  })
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSaving, setFormSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [csvText, setCsvText] = useState(INITIAL_CSV)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importSaving, setImportSaving] = useState(false)
  const [droppingId, setDroppingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [codeQuery, setCodeQuery] = useState('')
  const [codeSearching, setCodeSearching] = useState(false)
  const [codeMessage, setCodeMessage] = useState<string | null>(null)
  const [foundUsers, setFoundUsers] = useState<User[]>([])

  const listed = usersState.data?.items ?? []
  const sections = sectionsState.data?.items ?? []
  const enrollments = enrollmentsState.data?.items ?? []
  // Con miles de usuarios, los matriculados que no vinieron en la lista se piden uno por uno.
  const enrolledUsers = useUsers(enrollments.map((enrollment) => enrollment.userId))
  const users = [
    ...foundUsers.filter((found) => !listed.some((user) => user.userId === found.userId)),
    ...listed,
  ]
  const userById = new Map([
    ...enrolledUsers,
    ...users.map((user) => [user.userId, user] as const),
  ])
  const sectionById = new Map(sections.map((section) => [section.sectionId, section]))
  const loading = usersState.loading || sectionsState.loading || enrollmentsState.loading
  const loadError =
    usersState.error ?? sectionsState.error ?? enrollmentsState.error ?? null

  const userOptions = [
    { value: '', label: 'Selecciona un usuario' },
    ...users
      .filter((user) => user.role !== 'ADMIN')
      .map((user) => ({
        value: user.userId,
        label: `${user.familyName}, ${user.givenName} · ${
          user.institutionalCode ?? user.email
        }`,
      })),
  ]

  const sectionOptions = [
    { value: '', label: 'Sin sección' },
    ...sections.map((section) => ({
      value: section.sectionId,
      label: section.name,
    })),
  ]

  async function handleCodeSearch() {
    const code = codeQuery.trim()
    setCodeMessage(null)
    if (!code) {
      setCodeMessage('Escribe un código institucional.')
      return
    }
    setCodeSearching(true)
    try {
      const page = await listUsers({ institutionalCode: code, limit: 1 })
      const user = page.items[0]
      if (!user) {
        setCodeMessage(`No hay un usuario con el código ${code}.`)
        return
      }
      rememberUsers([user])
      setFoundUsers((current) => [
        user,
        ...current.filter((u) => u.userId !== user.userId),
      ])
      setForm((current) => ({
        ...current,
        userId: user.userId,
        role: user.role === 'TEACHER' ? 'TEACHER' : 'STUDENT',
      }))
      setCodeMessage(`Seleccionado: ${user.givenName} ${user.familyName}.`)
    } catch (cause) {
      setCodeMessage(messageFromError(cause))
    } finally {
      setCodeSearching(false)
    }
  }

  function openForm() {
    setCodeQuery('')
    setCodeMessage(null)
    setForm({
      userId: '',
      role: 'STUDENT',
      sectionId: sections[0]?.sectionId ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  function openImport() {
    setCsvText(INITIAL_CSV)
    setImportError(null)
    setImportResult(null)
    setImportOpen(true)
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!form.userId) {
      setFormError('Selecciona un usuario.')
      return
    }

    setFormSaving(true)
    try {
      await createEnrollment(courseId, {
        userId: form.userId,
        role: form.role,
        sectionId: form.sectionId || undefined,
      })
      setFormOpen(false)
      enrollmentsState.reload()
    } catch (cause) {
      setFormError(messageFromError(cause))
    } finally {
      setFormSaving(false)
    }
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setImportError(null)
    setImportResult(null)

    if (csvText.trim().length === 0) {
      setImportError('Pega el CSV o selecciona un archivo.')
      return
    }

    setImportSaving(true)
    try {
      const result = await importEnrollments(courseId, csvText)
      setImportResult(result)
      enrollmentsState.reload()
    } catch (cause) {
      setImportError(messageFromError(cause))
    } finally {
      setImportSaving(false)
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    setCsvText(await file.text())
  }

  async function handleDrop(enrollmentId: string, name: string) {
    if (!window.confirm(`¿Retirar a ${name} del curso?`)) {
      return
    }

    setDroppingId(enrollmentId)
    setActionError(null)
    try {
      await dropEnrollment(courseId, enrollmentId)
      enrollmentsState.reload()
    } catch (cause) {
      setActionError(messageFromError(cause))
    } finally {
      setDroppingId(null)
    }
  }

  return (
    <section aria-label="Matrículas" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Matrículas</h2>
          <p className="text-xs text-slate-500">
            Matricula usuarios uno a uno o carga un CSV institucional.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Upload className="size-4" aria-hidden />}
            onClick={openImport}
          >
            Importar CSV
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="size-4" aria-hidden />}
            onClick={openForm}
          >
            Matricular
          </Button>
        </div>
      </div>

      {actionError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : loadError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </p>
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="Todavía no hay matrículas"
          description="Usa el botón Matricular o importa un CSV con códigos institucionales."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Usuario</TableHeaderCell>
              <TableHeaderCell>Código</TableHeaderCell>
              <TableHeaderCell>Rol</TableHeaderCell>
              <TableHeaderCell>Sección</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrollments.map((enrollment) => {
              const user = userById.get(enrollment.userId)
              const section = enrollment.sectionId
                ? sectionById.get(enrollment.sectionId)
                : undefined
              const name = user
                ? `${user.givenName} ${user.familyName}`
                : enrollment.userId

              return (
                <TableRow key={enrollment.enrollmentId}>
                  <TableCell>
                    <p className="font-medium text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{user?.email ?? '—'}</p>
                  </TableCell>
                  <TableCell>{user?.institutionalCode ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={enrollment.role === 'TEACHER' ? 'brand' : 'neutral'}>
                      {enrollment.role === 'TEACHER' ? 'Docente' : 'Estudiante'}
                    </Badge>
                  </TableCell>
                  <TableCell>{section?.name ?? 'Sin sección'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={droppingId === enrollment.enrollmentId}
                      leftIcon={<Trash2 className="size-4" aria-hidden />}
                      onClick={() => handleDrop(enrollment.enrollmentId, name)}
                    >
                      Retirar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Matricular usuario"
        description="La matrícula se crea con el userId del perfil; el nombre se resuelve con ms-usuarios."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="enrollment-form" loading={formSaving}>
              Matricular
            </Button>
          </>
        }
      >
        <form id="enrollment-form" className="space-y-4" onSubmit={handleCreate}>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Buscar por código institucional"
                placeholder="Ej. 202310457"
                value={codeQuery}
                onChange={(event) => setCodeQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleCodeSearch()
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              loading={codeSearching}
              leftIcon={<Search className="size-4" aria-hidden />}
              onClick={() => void handleCodeSearch()}
            >
              Buscar
            </Button>
          </div>
          {codeMessage ? <p className="text-sm text-slate-600">{codeMessage}</p> : null}
          <Select
            label="Usuario"
            options={userOptions}
            value={form.userId}
            onChange={(event) =>
              setForm((current) => ({ ...current, userId: event.target.value }))
            }
          />
          <Select
            label="Rol"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as 'STUDENT' | 'TEACHER',
              }))
            }
          />
          <Select
            label="Sección"
            options={sectionOptions}
            value={form.sectionId}
            onChange={(event) =>
              setForm((current) => ({ ...current, sectionId: event.target.value }))
            }
          />
          {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
        </form>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar matrículas"
        description="Cabecera: institutionalCode,role,section. Las filas con error no detienen la importación."
        className="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cerrar
            </Button>
            <Button type="submit" form="import-form" loading={importSaving}>
              Importar
            </Button>
          </>
        }
      >
        <form id="import-form" className="space-y-4" onSubmit={handleImport}>
          <Input
            label="Archivo CSV"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
          />
          <div className="space-y-1.5">
            <label
              htmlFor="csv-text"
              className="block text-sm font-medium text-slate-700"
            >
              Contenido del CSV
            </label>
            <textarea
              id="csv-text"
              rows={8}
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {importError ? <p className="text-sm text-rose-600">{importError}</p> : null}
          {importResult ? (
            <Card>
              <CardHeader>
                <CardTitle>Resultado de la importación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>
                  <strong className="font-semibold text-emerald-700">
                    {importResult.created}
                  </strong>{' '}
                  creadas ·{' '}
                  <strong className="font-semibold text-amber-700">
                    {importResult.skipped}
                  </strong>{' '}
                  omitidas ·{' '}
                  <strong className="font-semibold text-rose-700">
                    {importResult.errors.length}
                  </strong>{' '}
                  con error
                </p>
                {importResult.errors.length > 0 ? (
                  <ul className="space-y-1 text-xs">
                    {importResult.errors.map((error) => (
                      <li key={`${error.line}-${error.institutionalCode}`}>
                        Línea {error.line} · {error.institutionalCode || 'sin código'} ·{' '}
                        {error.code}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </form>
      </Modal>
    </section>
  )
}
