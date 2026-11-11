import type { ReactNode } from 'react'
import { EmptyState } from '@/components/ui'
import { PageHeader } from './PageHeader'

export interface ModulePlaceholderProps {
  title: string
  description: string
  icon: ReactNode
  emptyTitle: string
  emptyDescription: string
  task: string
}

export function ModulePlaceholder({
  title,
  description,
  icon,
  emptyTitle,
  emptyDescription,
  task,
}: ModulePlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} description={description} eyebrow="Módulo" />
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <p className="text-xs text-slate-400">
            Se implementa en la tarea <span className="font-medium">{task}</span>.
          </p>
        }
      />
    </div>
  )
}
