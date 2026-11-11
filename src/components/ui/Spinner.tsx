import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Cargando' }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-slate-500">
      <Loader2 className={cn('size-4 animate-spin', className)} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}
