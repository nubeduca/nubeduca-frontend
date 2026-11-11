import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-md text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
