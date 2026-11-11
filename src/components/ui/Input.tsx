import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  startIcon?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  startIcon,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = `${inputId}-description`

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {startIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {startIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={hint || error ? descriptionId : undefined}
          className={cn(
            'h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100',
            Boolean(startIcon) && 'pl-10',
            error ? 'border-rose-400' : 'border-slate-300',
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={descriptionId} className="text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
