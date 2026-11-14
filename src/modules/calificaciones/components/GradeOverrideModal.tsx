import { useState } from 'react'
import type { FormEvent } from 'react'
import { Badge, Button, Input, Modal, Spinner } from '@/components/ui'
import { getGradeHistory, overrideGrade } from '@/lib/api/calificaciones'
import type { Grade, GradeItem } from '@/lib/api/types'
import { errorMessage, formatDateTime, formatScore } from '@/lib/format'
import { useApi } from '@/lib/hooks/useApi'

export interface GradeOverrideModalProps {
  grade: Grade | null
  gradeItem: GradeItem | null
  studentName: string
  nameOf: (userId: string) => string
  onClose: () => void
  onSaved: () => void
}

export function GradeOverrideModal(props: GradeOverrideModalProps) {
  if (!props.grade || !props.gradeItem) {
    return null
  }
  return <OverrideForm {...props} grade={props.grade} gradeItem={props.gradeItem} />
}

function OverrideForm({
  grade,
  gradeItem,
  studentName,
  nameOf,
  onClose,
  onSaved,
}: GradeOverrideModalProps & { grade: Grade; gradeItem: GradeItem }) {
  const history = useApi(() => getGradeHistory(grade.gradeId), [grade.gradeId])
  const [score, setScore] = useState(String(grade.score))
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const value = Number(score)
    if (!Number.isFinite(value) || value < 0 || value > grade.maxScore) {
      setError(`La nota debe estar entre 0 y ${formatScore(grade.maxScore)}.`)
      return
    }
    if (reason.trim().length < 5) {
      setError('Explica el motivo del cambio (al menos 5 caracteres).')
      return
    }
    setSaving(true)
    try {
      await overrideGrade(grade.gradeId, { score: value, reason: reason.trim() })
      onSaved()
    } catch (cause) {
      setError(errorMessage(cause))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${studentName} · ${gradeItem.title}`}
      description={
        grade.status === 'POSTED'
          ? 'La nota ya está publicada: el alumno recibirá un aviso con la corrección.'
          : 'La nota está en borrador; el alumno la verá cuando publiques la columna.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" form="override-form" loading={saving}>
            Corregir nota
          </Button>
        </>
      }
    >
      <form id="override-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <Input
            label={`Nota (de ${formatScore(grade.maxScore)})`}
            type="number"
            min={0}
            max={grade.maxScore}
            step="0.5"
            value={score}
            onChange={(event) => setScore(event.target.value)}
          />
          <Input
            label="Motivo"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Revisión solicitada por el alumno"
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>

      <div className="mt-5 space-y-2">
        <p className="text-sm font-semibold text-slate-900">Historial</p>
        {history.loading ? (
          <Spinner />
        ) : history.error ? (
          <p className="text-sm text-rose-600">{history.error}</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
            {(history.data?.items ?? []).map((entry) => (
              <li
                key={`${entry.changedAt}-${entry.score}`}
                className="space-y-0.5 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={entry.cause === 'GRADED' ? 'brand' : 'warning'}>
                    {entry.cause === 'GRADED' ? 'Calificación' : 'Corrección'}
                  </Badge>
                  <span className="font-medium text-slate-900">
                    {entry.previousScore == null ? '—' : formatScore(entry.previousScore)}{' '}
                    → {formatScore(entry.score)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {formatDateTime(entry.changedAt)} · {nameOf(entry.changedBy)}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
