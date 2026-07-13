import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'
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
  /** Visual tone for icon + confirm button. Default `danger`. */
  tone?: 'danger' | 'primary'
}

export function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirming = false,
  icon = 'delete_forever',
  tone = 'danger',
}: ConfirmActionModalProps) {
  const closeIfIdle = () => {
    if (!confirming) onClose()
  }

  const { handleProps, sheetStyle } = useSwipeToClose(closeIfIdle, {
    enabled: open && !confirming,
  })

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirming) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, confirming])

  if (!open) return null

  const isDanger = tone === 'danger'

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center lg:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        disabled={confirming}
        onClick={closeIfIdle}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-[1.75rem] bg-surface shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.35)] lg:rounded-[1.75rem] lg:shadow-2xl"
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-1 lg:px-5 lg:pt-4">
          <div className="lg:hidden">
            <BottomSheetHandle {...handleProps} />
          </div>

          <div className="flex items-start justify-between gap-3 pb-2">
            <h2
              id="confirm-action-title"
              className="pt-1 text-lg font-bold text-on-surface lg:text-xl"
            >
              {title}
            </h2>
            <button
              type="button"
              disabled={confirming}
              onClick={closeIfIdle}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-transform active:scale-95 disabled:opacity-50"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 pb-2 text-center lg:px-6">
          <div
            className={cn(
              'mx-auto flex size-14 items-center justify-center rounded-full lg:size-16',
              isDanger ? 'bg-error-container text-error' : 'bg-primary/10 text-primary',
            )}
          >
            <span
              className="material-symbols-outlined text-[28px] lg:text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
          </div>
          <div className="space-y-1.5">
            <p className="text-[15px] leading-relaxed font-medium text-on-surface lg:text-base">
              {message}
            </p>
            {description ? (
              <p className="text-sm leading-relaxed text-on-surface-variant">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="app-cta-safe flex gap-2 px-4 pt-4 pb-4 lg:gap-3 lg:px-5 lg:pb-5">
          <button
            type="button"
            disabled={confirming}
            onClick={closeIfIdle}
            className="h-12 flex-1 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant transition-colors active:bg-surface-container-low disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className={cn(
              'h-12 flex-[1.2] rounded-xl text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60',
              isDanger ? 'bg-error' : 'bg-primary',
            )}
          >
            {confirming ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
