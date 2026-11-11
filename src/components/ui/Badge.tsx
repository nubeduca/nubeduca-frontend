import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'neutral'

const variantClasses: Record<BadgeVariant, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
