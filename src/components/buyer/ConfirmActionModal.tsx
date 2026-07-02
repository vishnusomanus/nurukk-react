import { useEffect } from 'react'
import { cn } from '@/utils/cn'

export type ConfirmActionModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  icon?: string
}

export function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirming = false,
  icon = 'delete_forever',
}: ConfirmActionModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirming) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, confirming])

  if (!open) return null

  return (
    <div
      className="stitch-confirm-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="presentation"
      onClick={() => {
        if (!confirming) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        className="stitch-address-modal-shadow w-full max-w-md overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <h2 id="confirm-action-title" className="text-headline-lg-mobile font-bold text-on-surface">
            {title}
          </h2>
          <button
            type="button"
            disabled={confirming}
            onClick={onClose}
            className="text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-container text-error">
            <span
              className="material-symbols-outlined text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
          </div>
          <p className="text-body-lg leading-relaxed text-on-surface">{message}</p>
          {description ? (
            <p className="text-body-md mt-2 text-on-surface-variant">{description}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-4 bg-surface-container-low px-6 py-4">
          <button
            type="button"
            disabled={confirming}
            onClick={onClose}
            className="rounded-xl px-6 py-2 font-semibold text-primary transition-colors hover:bg-surface-variant disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className={cn(
              'rounded-xl bg-primary px-6 py-2 font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:opacity-60',
            )}
          >
            {confirming ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
