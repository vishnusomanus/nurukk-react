import { useEffect, useState } from 'react'
import { CouponAdvancedFields } from '@/components/coupons/CouponAdvancedFields'
import {
  COUPON_TYPES,
  SELLER_COUPON_TYPES,
  type CouponPayload,
} from '@/api/services/adminCouponsService'
import { couponFormToPayload, defaultCouponFormState, type CouponFormState } from '@/utils/couponForm'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const inputClass =
  'mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary'

type CouponFormModalProps = {
  open: boolean
  variant: 'platform' | 'seller'
  saving?: boolean
  error?: unknown
  onClose: () => void
  onSubmit: (payload: CouponPayload) => void
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={saving ? undefined : onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-form-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 px-6 py-5">
          <div>
            <h3 id="coupon-form-title" className="text-headline-lg text-on-surface">
              {variant === 'platform' ? 'Create platform coupon' : 'Create store coupon'}
            </h3>
            <p className="text-body-md mt-1 text-on-surface-variant">
              {variant === 'platform'
                ? 'Set discount rules, validity, usage limits, and who can redeem this offer.'
                : 'Create a promotion for buyers shopping at your store.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="stitch-scrollbar space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label>
                <span className="text-label-md text-on-surface-variant">Code</span>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value)}
                  placeholder={variant === 'platform' ? 'SAVE10' : 'FRESH20'}
                  className={cn(inputClass, 'uppercase')}
                />
              </label>
              <label>
                <span className="text-label-md text-on-surface-variant">Title (optional)</span>
                <input
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="Summer sale"
                  className={inputClass}
                />
              </label>
              <label>
                <span className="text-label-md text-on-surface-variant">Type</span>
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
              <label>
                <span className="text-label-md text-on-surface-variant">Value</span>
                <input
                  required
                  value={form.value}
                  onChange={(e) => setField('value', e.target.value)}
                  type="number"
                  min={0}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-label-md text-on-surface-variant">Minimum order amount</span>
                <input
                  value={form.minOrder}
                  onChange={(e) => setField('minOrder', e.target.value)}
                  type="number"
                  min={0}
                  className={inputClass}
                />
              </label>
            </div>

            <CouponAdvancedFields
              form={form}
              onChange={setField}
              allowSpecificUsers={variant === 'platform'}
            />

            {error ? (
              <p className="text-body-md text-error">{getApiErrorMessage(error, 'Could not create coupon')}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/30 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-outline-variant px-5 py-2.5 font-bold text-on-surface-variant disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.code.trim()}
              className="rounded-xl bg-primary px-5 py-2.5 font-bold text-on-primary disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
