import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
