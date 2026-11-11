import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('space-y-1 p-5 pb-0', className)}>{children}</div>
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h2 className={cn('text-base font-semibold text-slate-900', className)}>
      {children}
    </h2>
  )
}

export function CardDescription({ children, className }: CardProps) {
  return <p className={cn('text-sm text-slate-500', className)}>{children}</p>
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div
      className={cn('flex items-center gap-2 border-t border-slate-100 p-5', className)}
    >
      {children}
    </div>
  )
}
