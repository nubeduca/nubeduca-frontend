import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: SelectOption[]
}

export function Select({
  label,
  hint,
  error,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const descriptionId = `${selectId}-description`

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? descriptionId : undefined}
        className={cn(
          'h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100',
          error ? 'border-rose-400' : 'border-slate-300',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
