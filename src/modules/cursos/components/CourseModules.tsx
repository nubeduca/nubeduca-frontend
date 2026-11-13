import { ExternalLink, FileText, Link2, Plus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
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
} from '@/components/ui'
import {
  addModuleItem,
  createModule,
  listModules,
  publishModule,
} from '@/lib/api/contenidos'
import { ApiError } from '@/lib/api/client'
import type { Module, ModuleItem, ModuleItemInput } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/useApi'

export interface CourseModulesProps {
  courseId: string
  canManage: boolean
}

interface ModuleForm {
  title: string
  position: string
}

interface ItemForm {
  type: 'PAGE' | 'LINK'
  title: string
  body: string
  url: string
}

const ITEM_TYPE_OPTIONS = [
  { value: 'PAGE', label: 'Página' },
  { value: 'LINK', label: 'Enlace' },
]

function messageFromError(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : 'No se pudo completar la operación.'
}

function emptyModuleForm(): ModuleForm {
  return { title: '', position: '1' }
}

function emptyItemForm(): ItemForm {
  return { type: 'PAGE', title: '', body: '', url: '' }
}

export function CourseModules({ courseId, canManage }: CourseModulesProps) {
  const modulesState = useApi(() => listModules(courseId), [courseId])
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModuleForm)
  const [moduleOpen, setModuleOpen] = useState(false)
  const [moduleError, setModuleError] = useState<string | null>(null)
  const [moduleSaving, setModuleSaving] = useState(false)
  const [itemModule, setItemModule] = useState<Module | null>(null)
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm)
  const [itemError, setItemError] = useState<string | null>(null)
  const [itemSaving, setItemSaving] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const modules = modulesState.data?.items ?? []

  function openModuleModal() {
    setModuleForm({ title: '', position: String(modules.length + 1) })
    setModuleError(null)
    setModuleOpen(true)
  }

  function openItemModal(module: Module) {
    setItemModule(module)
    setItemForm(emptyItemForm())
    setItemError(null)
  }

  async function handleCreateModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setModuleError(null)

    const position = Number(moduleForm.position)
    if (moduleForm.title.trim().length === 0) {
      setModuleError('Escribe un título para el módulo.')
      return
    }
    if (!Number.isInteger(position) || position < 1) {
      setModuleError('La posición debe ser un número mayor o igual a 1.')
      return
    }

    setModuleSaving(true)
    try {
      await createModule(courseId, {
        title: moduleForm.title.trim(),
        position,
      })
      setModuleOpen(false)
      modulesState.reload()
    } catch (cause) {
      setModuleError(messageFromError(cause))
    } finally {
      setModuleSaving(false)
    }
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!itemModule) {
      return
    }
    setItemError(null)

    if (itemForm.title.trim().length === 0) {
      setItemError('Escribe un título para el ítem.')
      return
    }
    if (itemForm.type === 'LINK' && itemForm.url.trim().length === 0) {
      setItemError('Escribe la URL del enlace.')
      return
    }

    const input: ModuleItemInput =
      itemForm.type === 'LINK'
        ? {
            type: 'LINK',
            title: itemForm.title.trim(),
            url: itemForm.url.trim(),
          }
        : {
            type: 'PAGE',
            title: itemForm.title.trim(),
            body: itemForm.body,
          }

    setItemSaving(true)
    try {
      await addModuleItem(courseId, itemModule.moduleId, input)
      setItemModule(null)
      modulesState.reload()
    } catch (cause) {
      setItemError(messageFromError(cause))
    } finally {
      setItemSaving(false)
    }
  }

  async function handlePublish(module: Module) {
    setPublishingId(module.moduleId)
    setActionError(null)
    try {
      await publishModule(courseId, module.moduleId)
      modulesState.reload()
    } catch (cause) {
      setActionError(messageFromError(cause))
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <section aria-label="Módulos" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Módulos del curso</h2>
          <p className="text-xs text-slate-500">
            {canManage
              ? 'Crea módulos, agrega ítems y publícalos para los estudiantes.'
              : 'Contenido publicado del curso.'}
          </p>
        </div>
        {canManage ? (
          <Button
            size="sm"
            leftIcon={<Plus className="size-4" aria-hidden />}
            onClick={openModuleModal}
          >
            Nuevo módulo
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </p>
      ) : null}

      {modulesState.loading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : modulesState.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {modulesState.error}
        </p>
      ) : modules.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-6" aria-hidden />}
          title="Todavía no hay módulos publicados"
          description={
            canManage
              ? 'Crea el primer módulo y agrega una página o un enlace.'
              : 'El docente aún no ha publicado contenido para este curso.'
          }
        />
      ) : (
        <div className="space-y-3">
          {modules.map((module) => (
            <Card key={module.moduleId}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant="neutral">Módulo {module.position}</Badge>
                    <CardTitle className="truncate">{module.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={module.status === 'PUBLISHED' ? 'success' : 'warning'}
                    >
                      {module.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                    </Badge>
                    {canManage && module.status === 'DRAFT' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={publishingId === module.moduleId}
                        onClick={() => handlePublish(module)}
                      >
                        Publicar
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Button
                        size="sm"
                        leftIcon={<Plus className="size-4" aria-hidden />}
                        onClick={() => openItemModal(module)}
                      >
                        Ítem
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {module.items.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Este módulo todavía no tiene ítems.
                  </p>
                ) : (
                  module.items.map((item) => (
                    <ModuleItemRow key={item.itemId} item={item} />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={moduleOpen}
        onClose={() => setModuleOpen(false)}
        title="Nuevo módulo"
        description="El módulo se crea en borrador; publícalo cuando tenga al menos un ítem."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModuleOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="module-form" loading={moduleSaving}>
              Crear módulo
            </Button>
          </>
        }
      >
        <form id="module-form" className="space-y-4" onSubmit={handleCreateModule}>
          <Input
            label="Título"
            value={moduleForm.title}
            onChange={(event) =>
              setModuleForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Fundamentos de la nube"
          />
          <Input
            label="Posición"
            type="number"
            min={1}
            value={moduleForm.position}
            onChange={(event) =>
              setModuleForm((current) => ({
                ...current,
                position: event.target.value,
              }))
            }
            hint="Orden del módulo dentro del curso."
          />
          {moduleError ? <p className="text-sm text-rose-600">{moduleError}</p> : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(itemModule)}
        onClose={() => setItemModule(null)}
        title={`Agregar ítem a ${itemModule?.title ?? 'módulo'}`}
        description="Los ítems se agregan al final del módulo. No se pueden editar ni borrar en este contrato."
        footer={
          <>
            <Button variant="ghost" onClick={() => setItemModule(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="item-form" loading={itemSaving}>
              Agregar ítem
            </Button>
          </>
        }
      >
        <form id="item-form" className="space-y-4" onSubmit={handleAddItem}>
          <Select
            label="Tipo"
            options={ITEM_TYPE_OPTIONS}
            value={itemForm.type}
            onChange={(event) =>
              setItemForm((current) => ({
                ...current,
                type: event.target.value as 'PAGE' | 'LINK',
              }))
            }
          />
          <Input
            label="Título"
            value={itemForm.title}
            onChange={(event) =>
              setItemForm((current) => ({ ...current, title: event.target.value }))
            }
          />
          {itemForm.type === 'PAGE' ? (
            <div className="space-y-1.5">
              <label
                htmlFor="item-body"
                className="block text-sm font-medium text-slate-700"
              >
                Contenido
              </label>
              <textarea
                id="item-body"
                rows={6}
                value={itemForm.body}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, body: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="Texto de la página"
              />
            </div>
          ) : (
            <Input
              label="URL"
              type="url"
              value={itemForm.url}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, url: event.target.value }))
              }
              placeholder="https://docs.aws.amazon.com/"
            />
          )}
          {itemError ? <p className="text-sm text-rose-600">{itemError}</p> : null}
        </form>
      </Modal>
    </section>
  )
}

function ModuleItemRow({ item }: { item: ModuleItem }) {
  const Icon = item.type === 'LINK' ? Link2 : FileText

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
          <Icon className="size-4" aria-hidden />
        </span>
        <Badge variant="neutral">
          {item.type === 'PAGE' ? 'Página' : item.type === 'LINK' ? 'Enlace' : 'Archivo'}
        </Badge>
        <p className="text-sm font-medium text-slate-900">{item.title}</p>
      </div>
      {item.type === 'PAGE' && item.body ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p>
      ) : null}
      {item.type === 'LINK' && item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Abrir enlace
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}
      {item.type === 'FILE' && item.fileId ? (
        <p className="mt-2 text-xs text-slate-500">Archivo: {item.fileId}</p>
      ) : null}
    </div>
  )
}
