import { ApiError } from '@/lib/api/client'

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

/** ISO → valor de un `<input type="datetime-local">` en la hora local. */
export function toDateTimeLocal(value: string): string {
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

/** Valor de un `<input type="datetime-local">` → ISO en UTC sin milisegundos. */
export function fromDateTimeLocal(value: string): string | null {
  const time = Date.parse(value)
  if (Number.isNaN(time)) {
    return null
  }
  return new Date(time).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function errorMessage(cause: unknown): string {
  if (cause instanceof ApiError) {
    return cause.message
  }
  if (cause instanceof Error && cause.message) {
    return cause.message
  }
  return 'No se pudo completar la operación.'
}

export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}
