import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CouponAdvancedFields } from '@/components/coupons/CouponAdvancedFields'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import {
  COUPON_TYPES,
  SELLER_COUPON_TYPES,
  type CouponPayload,
} from '@/api/services/adminCouponsService'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'
import { couponFormToPayload, defaultCouponFormState, type CouponFormState } from '@/utils/couponForm'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const inputClass =
  'w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20'

type CouponFormModalProps = {
  open: boolean
  variant: 'platform' | 'seller'
  saving?: boolean
  error?: unknown
  onClose: () => void
  onSubmit: (payload: CouponPayload) => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block px-0.5 text-xs font-semibold text-on-surface-variant">{children}</span>
}

export function CouponFormModal({
  open,
  variant,
  saving,
  error,
  onClose,
  onSubmit,
}: CouponFormModalProps) {
  const [form, setForm] = useState<CouponFormState>(defaultCouponFormState())
  const couponTypes = variant === 'platform' ? COUPON_TYPES : SELLER_COUPON_TYPES
  const busy = Boolean(saving)

  const closeIfIdle = () => {
    if (!busy) onClose()
  }

  const { handleProps, sheetStyle } = useSwipeToClose(closeIfIdle, { enabled: open && !busy })

  useEffect(() => {
    if (open) {
      setForm(defaultCouponFormState())
    }
  }, [open])

  const setField = <K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (!open) return null

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit(couponFormToPayload(form))
  }

  const title = variant === 'platform' ? 'Create platform coupon' : 'Create store coupon'
  const subtitle =
    variant === 'platform'
      ? 'Discount rules, validity, and who can redeem'
      : 'Promotion for buyers at your store'

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coupon-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={closeIfIdle}
      />

      <div
        className="relative z-10 flex max-h-[min(94dvh,880px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-surface shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.35)] lg:max-w-2xl lg:rounded-[1.75rem] lg:shadow-2xl"
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-20 shrink-0 bg-surface px-4 pt-1 pb-2 lg:px-5">
          <div className="lg:hidden">
            <BottomSheetHandle {...handleProps} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeIfIdle}
              disabled={busy}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-transform active:scale-95 disabled:opacity-50"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
            <div className="min-w-0 flex-1 touch-none lg:pointer-events-none" {...handleProps}>
              <h2 id="coupon-form-title" className="text-base font-bold text-on-surface lg:text-lg">
                {title}
              </h2>
              <p className="truncate text-xs text-on-surface-variant">{subtitle}</p>
            </div>
          </div>
        </div>

        <form id="coupon-form" className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-3 lg:px-5 lg:py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Code</FieldLabel>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value)}
                  placeholder={variant === 'platform' ? 'SAVE10' : 'FRESH20'}
                  className={cn(inputClass, 'uppercase')}
                />
              </label>
              <label className="block">
                <FieldLabel>Title (optional)</FieldLabel>
                <input
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="Summer sale"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <FieldLabel>Type</FieldLabel>
                <select
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                  className={inputClass}
                >
                  {couponTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <FieldLabel>Value</FieldLabel>
                <input
                  required
                  value={form.value}
                  onChange={(e) => setField('value', e.target.value)}
                  type="number"
                  min={0}
                  inputMode="decimal"
                  className={inputClass}
                />
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel>Minimum order amount</FieldLabel>
                <input
                  value={form.minOrder}
                  onChange={(e) => setField('minOrder', e.target.value)}
                  type="number"
                  min={0}
                  inputMode="decimal"
                  className={inputClass}
                />
              </label>
            </div>

            <CouponAdvancedFields
              form={form}
              onChange={setField}
              allowSpecificUsers={variant === 'platform'}
              inputClassName={inputClass}
            />

            {error ? (
              <p className="rounded-xl border border-error/20 bg-error-container px-3 py-2 text-sm text-error">
                {getApiErrorMessage(error, 'Could not create coupon')}
              </p>
            ) : null}
          </div>

          <div className="app-cta-safe shrink-0 border-t border-outline-variant/30 bg-surface/95 px-4 py-3 backdrop-blur-md lg:px-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeIfIdle}
                disabled={busy}
                className="h-12 shrink-0 rounded-xl border border-outline-variant px-5 text-sm font-bold text-on-surface-variant disabled:opacity-50 active:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !form.code.trim()}
                className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {busy ? 'Creating…' : 'Create coupon'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
