import { useEffect } from 'react'
import { cn } from '@/utils/cn'

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white text-zinc-900 shadow-lg dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none',
          className,
        )}
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div
            id="modal-title"
            className="border-b border-black/10 px-4 py-3 text-sm font-semibold dark:border-white/10"
          >
            {title}
          </div>
        ) : null}
        <div className="min-h-0 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
