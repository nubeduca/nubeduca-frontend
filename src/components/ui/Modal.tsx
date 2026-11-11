import { X } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn('w-full max-w-lg rounded-2xl bg-white shadow-xl', className)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="space-y-1">
            <h2 id="modal-title" className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
