import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Modal } from '@/components/ui'
import { gradeSubmission } from '@/lib/api/evaluaciones'
import type { Assignment, Submission } from '@/lib/api/types'
import { errorMessage, formatScore } from '@/lib/format'
import {
  defaultRubric,
  parseFeedback,
  rubricToFeedback,
  type RubricCriterion,
} from './rubric'

export interface GradeWithRubricModalProps {
  assignment: Assignment
  submission: Submission | null
  studentName: string
  onClose: () => void
  onGraded: (submission: Submission) => void
}

const cellInput =
  'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100'

export function GradeWithRubricModal(props: GradeWithRubricModalProps) {
  if (!props.submission) {
    return null
  }
  return <GradeForm {...props} submission={props.submission} />
}

function GradeForm({
  assignment,
  submission,
  studentName,
  onClose,
  onGraded,
}: GradeWithRubricModalProps & { submission: Submission }) {
  const previous = parseFeedback(submission.feedback)
  const [criteria, setCriteria] = useState<RubricCriterion[]>(
    () => previous?.criteria ?? defaultRubric(assignment.maxScore),
  )
  const [comment, setComment] = useState(
    () => previous?.comment ?? (previous ? '' : (submission.feedback ?? '')),
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const total = criteria.reduce((sum, item) => sum + item.score, 0)
  const totalMax = criteria.reduce((sum, item) => sum + item.max, 0)

  function update(id: number, patch: Partial<RubricCriterion>) {
    setCriteria((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function addCriterion() {
    setCriteria((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        name: '',
        max: 0,
        score: 0,
      },
    ])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (criteria.length === 0) {
      setError('Agrega al menos un criterio.')
      return
    }
    if (criteria.some((item) => !item.name.trim() || item.name.includes(':'))) {
      setError('Cada criterio necesita un nombre (sin ":").')
      return
    }
    if (
      criteria.some((item) => item.max <= 0 || item.score < 0 || item.score > item.max)
    ) {
      setError('Cada puntaje debe estar entre 0 y el máximo del criterio.')
      return
    }
    if (Math.abs(totalMax - assignment.maxScore) > 1e-9) {
      setError(
        `Los máximos de la rúbrica suman ${formatScore(totalMax)} y deben sumar ${formatScore(assignment.maxScore)}.`,
      )
      return
    }

    setSaving(true)
    try {
      const graded = await gradeSubmission(submission.submissionId, {
        score: total,
        feedback: rubricToFeedback(criteria, comment),
      })
      onGraded(graded)
    } catch (cause) {
      setError(errorMessage(cause))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Calificar a ${studentName}`}
      description={`${assignment.title} · intento ${submission.attempt}. La nota queda en borrador hasta que la publiques en el libro de notas.`}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="grade-form" loading={saving}>
            Guardar nota ({formatScore(total)}/{formatScore(assignment.maxScore)})
          </Button>
        </>
      }
    >
      <form id="grade-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="pb-2 font-medium">Criterio</th>
                <th className="w-24 pb-2 font-medium">Puntaje</th>
                <th className="w-24 pb-2 font-medium">Máximo</th>
                <th className="w-10 pb-2" />
              </tr>
            </thead>
            <tbody className="align-middle">
              {criteria.map((item) => (
                <tr key={item.id}>
                  <td className="py-1 pr-2">
                    <input
                      aria-label="Nombre del criterio"
                      value={item.name}
                      onChange={(event) => update(item.id, { name: event.target.value })}
                      className={cellInput}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      aria-label={`Puntaje de ${item.name}`}
                      type="number"
                      min={0}
                      max={item.max}
                      step="0.5"
                      value={item.score}
                      onChange={(event) =>
                        update(item.id, { score: Number(event.target.value) })
                      }
                      className={cellInput}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      aria-label={`Máximo de ${item.name}`}
                      type="number"
                      min={0}
                      step="0.5"
                      value={item.max}
                      onChange={(event) =>
                        update(item.id, { max: Number(event.target.value) })
                      }
                      className={cellInput}
                    />
                  </td>
                  <td className="py-1 text-right">
                    <button
                      type="button"
                      aria-label={`Quitar ${item.name || 'criterio'}`}
                      onClick={() =>
                        setCriteria((current) =>
                          current.filter((other) => other.id !== item.id),
                        )
                      }
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold text-slate-900">
                <td className="pt-2">Total</td>
                <td className="pt-2">{formatScore(total)}</td>
                <td
                  className={
                    Math.abs(totalMax - assignment.maxScore) > 1e-9
                      ? 'pt-2 text-rose-600'
                      : 'pt-2'
                  }
                >
                  {formatScore(totalMax)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={addCriterion}
        >
          Agregar criterio
        </Button>

        <div className="space-y-1.5">
          <label
            htmlFor="grade-comment"
            className="block text-sm font-medium text-slate-700"
          >
            Comentario para el alumno
          </label>
          <textarea
            id="grade-comment"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  )
}
