import { Paperclip, X } from 'lucide-react'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button, Modal } from '@/components/ui'
import { uploadFile } from '@/lib/api/contenidos'
import { submitAssignment } from '@/lib/api/evaluaciones'
import type { Assignment, Submission } from '@/lib/api/types'
import { errorMessage, formatDateTime } from '@/lib/format'

const MAX_FILES = 10
const MAX_BYTES = 52_428_800

export interface SubmitAssignmentModalProps {
  assignment: Assignment | null
  onClose: () => void
  onSubmitted: (submission: Submission) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function SubmitAssignmentModal(props: SubmitAssignmentModalProps) {
  if (!props.assignment) {
    return null
  }
  return <SubmitForm {...props} assignment={props.assignment} />
}

function SubmitForm({
  assignment,
  onClose,
  onSubmitted,
}: SubmitAssignmentModalProps & { assignment: Assignment }) {
  const [files, setFiles] = useState<File[]>([])
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [late] = useState(() => Date.now() > Date.parse(assignment.dueAt))

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    event.target.value = ''
    setError(null)

    const tooBig = picked.find((file) => file.size > MAX_BYTES)
    if (tooBig) {
      setError(`${tooBig.name} supera los 50 MB.`)
      return
    }
    const merged = [...files, ...picked].filter(
      (file, index, all) =>
        all.findIndex((other) => other.name === file.name && other.size === file.size) ===
        index,
    )
    if (merged.length > MAX_FILES) {
      setError(`Puedes adjuntar hasta ${MAX_FILES} archivos.`)
      return
    }
    setFiles(merged)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (files.length === 0) {
      setError('Adjunta al menos un archivo.')
      return
    }

    try {
      const fileIds: string[] = []
      for (const [index, file] of files.entries()) {
        setProgress(`Subiendo ${index + 1} de ${files.length}: ${file.name}`)
        fileIds.push(await uploadFile(assignment.courseId, 'SUBMISSION', file))
      }
      setProgress('Registrando la entrega…')
      const submission = await submitAssignment(assignment.assignmentId, {
        fileIds,
        comment: comment.trim() || undefined,
      })
      onSubmitted(submission)
    } catch (cause) {
      setError(errorMessage(cause))
      setProgress(null)
    }
  }

  const saving = progress !== null

  return (
    <Modal
      open
      onClose={saving ? () => undefined : onClose}
      title={`Entregar: ${assignment.title}`}
      description={`Fecha límite: ${formatDateTime(assignment.dueAt)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="submit-form" loading={saving}>
            Enviar entrega
          </Button>
        </>
      }
    >
      <form id="submit-form" className="space-y-4" onSubmit={handleSubmit}>
        {late ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            La fecha límite ya pasó: tu entrega quedará marcada como tardía.
          </p>
        ) : null}

        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50">
            <Paperclip className="size-4" aria-hidden />
            Adjuntar archivos
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={handleFiles}
              disabled={saving}
            />
          </label>
          <p className="text-xs text-slate-500">Hasta 10 archivos de 50 MB cada uno.</p>
          {files.length > 0 ? (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {files.map((file) => (
                <li
                  key={`${file.name}-${file.size}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-slate-700">{file.name}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                    {formatSize(file.size)}
                    <button
                      type="button"
                      aria-label={`Quitar ${file.name}`}
                      disabled={saving}
                      onClick={() =>
                        setFiles((current) => current.filter((item) => item !== file))
                      }
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="submit-comment"
            className="block text-sm font-medium text-slate-700"
          >
            Comentario (opcional)
          </label>
          <textarea
            id="submit-comment"
            rows={3}
            maxLength={2000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {progress ? <p className="text-sm text-slate-500">{progress}</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  )
}
