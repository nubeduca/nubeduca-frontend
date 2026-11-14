export interface RubricCriterion {
  id: number
  name: string
  max: number
  score: number
}

const LINE = /^(.+):\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2
}

/** Rúbrica por defecto: 40 % / 30 % / 30 % del puntaje máximo. */
export function defaultRubric(maxScore: number): RubricCriterion[] {
  const first = roundHalf(maxScore * 0.4)
  const second = roundHalf(maxScore * 0.3)
  const third = roundHalf(maxScore - first - second)
  return [
    { id: 1, name: 'Cumplimiento de lo pedido', max: first, score: 0 },
    { id: 2, name: 'Calidad técnica', max: second, score: 0 },
    { id: 3, name: 'Documentación', max: third, score: 0 },
  ]
}

/**
 * El contrato de ms-evaluaciones solo guarda `score` y `feedback`, así que la rúbrica
 * viaja dentro del feedback: una línea "Criterio: puntaje/máximo" por criterio,
 * una línea en blanco y el comentario libre.
 */
export function rubricToFeedback(criteria: RubricCriterion[], comment: string): string {
  const lines = criteria.map((item) => `${item.name.trim()}: ${item.score}/${item.max}`)
  const text = comment.trim()
  return text ? `${lines.join('\n')}\n\n${text}` : lines.join('\n')
}

export function parseFeedback(
  feedback: string | null | undefined,
): { criteria: RubricCriterion[]; comment: string } | null {
  if (!feedback) {
    return null
  }
  const [head = '', ...rest] = feedback.split(/\n\s*\n/)
  const criteria: RubricCriterion[] = []
  for (const [index, line] of head.split('\n').entries()) {
    const match = LINE.exec(line.trim())
    if (!match) {
      return null
    }
    criteria.push({
      id: index + 1,
      name: match[1]?.trim() ?? '',
      score: Number(match[2]),
      max: Number(match[3]),
    })
  }
  return criteria.length > 0 ? { criteria, comment: rest.join('\n\n') } : null
}
