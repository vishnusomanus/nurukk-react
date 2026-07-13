import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BuyerAddress } from '@/api/services/buyerService'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'

const CONFIRM_SECONDS = 5

export function LocationConfirmSheet({
  open,
  address,
  onClose,
  onConfirm,
  onChangeAddress,
}: {
  open: boolean
  address: BuyerAddress | null
  onClose: () => void
  onConfirm: () => void
  onChangeAddress?: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(CONFIRM_SECONDS)
  const { handleProps, sheetStyle } = useSwipeToClose(onClose, { enabled: open })

  useEffect(() => {
    if (!open) {
      setSecondsLeft(CONFIRM_SECONDS)
      return
    }

    setSecondsLeft(CONFIRM_SECONDS)
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [open])

  useEffect(() => {
    if (!open || secondsLeft > 0) return
    onConfirm()
  }, [open, secondsLeft, onConfirm])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !address) return null

  const progress = ((CONFIRM_SECONDS - secondsLeft) / CONFIRM_SECONDS) * 100
  const line = [
    address.address_line || address.line1,
    address.line2,
    address.city,
    address.pincode,
  ]
    .filter(Boolean)
    .join(', ')

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center lg:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-confirm-title"
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
              id="location-confirm-title"
              className="pt-1 text-lg font-bold text-on-surface lg:text-xl"
            >
              Confirm delivery location
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-transform active:scale-95"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 pb-2 lg:px-6">
          <div className="flex items-start gap-3 rounded-xl bg-surface-container-low px-3 py-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[22px]">location_on</span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface">{address.label || 'Delivery address'}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">{line || '—'}</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
              <span>Continuing in {secondsLeft}s</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="app-cta-safe flex gap-2 px-4 pt-4 pb-4 lg:gap-3 lg:px-5 lg:pb-5">
          <button
            type="button"
            onClick={() => {
              onClose()
              onChangeAddress?.()
            }}
            className="h-12 flex-1 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant transition-colors active:bg-surface-container-low"
          >
            Change
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 flex-[1.2] rounded-xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98]"
          >
            Confirm now
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
