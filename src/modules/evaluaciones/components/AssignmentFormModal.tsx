import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { createAssignment, updateAssignment } from '@/lib/api/evaluaciones'
import type { Assignment } from '@/lib/api/types'
import { errorMessage, fromDateTimeLocal, toDateTimeLocal } from '@/lib/format'

export interface AssignmentFormModalProps {
  courseId: string
  /** null = crear; una tarea = editar. */
  assignment: Assignment | null
  open: boolean
  onClose: () => void
  onSaved: (assignment: Assignment) => void
}

interface FormState {
  title: string
  instructions: string
  dueAt: string
  maxScore: string
  allowLate: boolean
}

function initialState(assignment: Assignment | null): FormState {
  if (assignment) {
    return {
      title: assignment.title,
      instructions: assignment.instructions ?? '',
      dueAt: toDateTimeLocal(assignment.dueAt),
      maxScore: String(assignment.maxScore),
      allowLate: assignment.allowLate ?? false,
    }
  }
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  nextWeek.setHours(23, 59, 0, 0)
  return {
    title: '',
    instructions: '',
    dueAt: toDateTimeLocal(nextWeek.toISOString()),
    maxScore: '20',
    allowLate: false,
  }
}

const textareaClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100'

export function AssignmentFormModal(props: AssignmentFormModalProps) {
  // Se monta de nuevo cada vez que se abre, así el formulario arranca limpio.
  if (!props.open) {
    return null
  }
  return <AssignmentForm {...props} />
}

function AssignmentForm({
  courseId,
  assignment,
  onClose,
  onSaved,
}: AssignmentFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(assignment))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const editing = assignment !== null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const title = form.title.trim()
    const dueAt = fromDateTimeLocal(form.dueAt)
    const maxScore = Number(form.maxScore)
    if (!title || title.length > 200) {
      setError('Escribe un título (máximo 200 caracteres).')
      return
    }
    if (!dueAt) {
      setError('Elige una fecha límite válida.')
      return
    }
    if (!editing && (!Number.isFinite(maxScore) || maxScore <= 0)) {
      setError('El puntaje máximo debe ser mayor que 0.')
      return
    }

    setSaving(true)
    try {
      const instructions = form.instructions.trim() || undefined
      const saved = editing
        ? await updateAssignment(assignment.assignmentId, {
            title,
            instructions: instructions ?? '',
            dueAt,
            allowLate: form.allowLate,
          })
        : await createAssignment(courseId, {
            title,
            instructions,
            dueAt,
            maxScore,
            allowLate: form.allowLate,
          })
      onSaved(saved)
    } catch (cause) {
      setError(errorMessage(cause))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Editar tarea' : 'Nueva tarea'}
      description={
        editing
          ? 'El puntaje máximo no se puede cambiar después de crear la tarea.'
          : 'La tarea se crea como borrador; publícala cuando esté lista.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="assignment-form" loading={saving}>
            {editing ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <form id="assignment-form" className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Título"
          value={form.title}
          maxLength={200}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Laboratorio 3 · Colas con DLQ"
        />
        <div className="space-y-1.5">
          <label
            htmlFor="assignment-instructions"
            className="block text-sm font-medium text-slate-700"
          >
            Instrucciones
          </label>
          <textarea
            id="assignment-instructions"
            rows={5}
            maxLength={20000}
            value={form.instructions}
            onChange={(event) =>
              setForm((current) => ({ ...current, instructions: event.target.value }))
            }
            className={textareaClass}
            placeholder="Qué deben entregar y cómo se evalúa."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha límite"
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) =>
              setForm((current) => ({ ...current, dueAt: event.target.value }))
            }
          />
          <Input
            label="Puntaje máximo"
            type="number"
            min={1}
            step="0.5"
            value={form.maxScore}
            disabled={editing}
            onChange={(event) =>
              setForm((current) => ({ ...current, maxScore: event.target.value }))
            }
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.allowLate}
            onChange={(event) =>
              setForm((current) => ({ ...current, allowLate: event.target.checked }))
            }
            className="size-4 rounded border-slate-300 text-brand-600"
          />
          Aceptar entregas después de la fecha límite (se marcan como tardías)
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  )
}
