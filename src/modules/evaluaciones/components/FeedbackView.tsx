import { formatScore } from '@/lib/format'
import { parseFeedback } from './rubric'

/** Muestra el feedback; si trae rúbrica, la pinta como tabla. */
export function FeedbackView({ feedback }: { feedback?: string | null }) {
  if (!feedback) {
    return null
  }
  const parsed = parseFeedback(feedback)
  if (!parsed) {
    return <p className="whitespace-pre-line text-sm text-slate-600">{feedback}</p>
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
        {parsed.criteria.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-slate-600">{item.name}</span>
            <span className="font-medium text-slate-900">
              {formatScore(item.score)}/{formatScore(item.max)}
            </span>
          </li>
        ))}
      </ul>
      {parsed.comment ? (
        <p className="whitespace-pre-line text-sm text-slate-600">{parsed.comment}</p>
      ) : null}
    </div>
  )
}
