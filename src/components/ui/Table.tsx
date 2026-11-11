import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className={cn('w-full text-left text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-slate-50 text-xs uppercase text-slate-500">{children}</thead>
  )
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="transition-colors hover:bg-slate-50/70">{children}</tr>
}

export function TableHeaderCell({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('whitespace-nowrap px-4 py-3 font-medium', className)} {...props}>
      {children}
    </th>
  )
}

export function TableCell({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-slate-700', className)} {...props}>
      {children}
    </td>
  )
}
