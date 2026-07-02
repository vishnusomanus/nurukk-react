import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BuyerCoupon } from '@/api/services/buyerService'
import { buyerService } from '@/api/services'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import {
  couponIssuerLabel,
  formatCouponBenefit,
  formatCouponHint,
  groupCouponsByIssuer,
} from '@/utils/couponLabel'
import { cn } from '@/utils/cn'

function CouponOfferRow({
  coupon,
  disabled,
  onApply,
}: {
  coupon: BuyerCoupon
  disabled?: boolean
  onApply: (code: string) => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onApply(coupon.code)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-fixed/5 disabled:opacity-60"
    >
      <div className="min-w-0">
        <p className="text-label-md font-bold text-primary">{coupon.code}</p>
        <p className="text-body-md truncate text-on-surface">
          {coupon.title?.trim() || formatCouponBenefit(coupon)}
        </p>
        <p className="text-label-md text-on-surface-variant">
          {couponIssuerLabel(coupon)}
          {(coupon.min_order_amount ?? 0) > 0 ? ` · Min ₹${coupon.min_order_amount}` : ''}
        </p>
      </div>
      <span className="text-label-md shrink-0 font-bold text-secondary">Apply</span>
    </button>
  )
}

export function CheckoutCouponCard({
  appliedCode,
  couponHint,
  availableCoupons = [],
  variant = 'card',
  className,
}: {
  appliedCode?: string | null
  couponHint?: string | null
  availableCoupons?: BuyerCoupon[]
  variant?: 'card' | 'pill'
  className?: string
}) {
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!appliedCode) setCode('')
  }, [appliedCode])

  const invalidateCheckout = () => {
    queryClient.invalidateQueries({ queryKey: ['buyer', 'cart'] })
    queryClient.invalidateQueries({ queryKey: ['buyer', 'checkout-preview'] })
    queryClient.invalidateQueries({ queryKey: ['buyer', 'coupons', 'available'] })
  }

  const applyCoupon = useMutation({
    mutationFn: (value: string) => buyerService.applyCartCoupon(value),
    onSuccess: () => {
      setFormError(null)
      invalidateCheckout()
    },
    onError: (err: unknown) => {
      setFormError(getApiErrorMessage(err, 'Could not apply coupon'))
    },
  })

  const removeCoupon = useMutation({
    mutationFn: () => buyerService.removeCartCoupon(),
    onSuccess: () => {
      setCode('')
      setFormError(null)
      invalidateCheckout()
    },
    onError: (err: unknown) => {
      setFormError(getApiErrorMessage(err, 'Could not remove coupon'))
    },
  })

  const isBusy = applyCoupon.isPending || removeCoupon.isPending
  const { platform, store } = groupCouponsByIssuer(availableCoupons)
  const hasOffers = platform.length > 0 || store.length > 0

  const handleApply = (value?: string) => {
    const trimmed = (value ?? code).trim()
    if (!trimmed) {
      setFormError('Enter a coupon code')
      return
    }
    setFormError(null)
    applyCoupon.mutate(trimmed)
  }

  const isPill = variant === 'pill'

  return (
    <section
      className={cn(
        isPill
          ? 'flex flex-col gap-2'
          : 'rounded-xl bg-surface p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] lg:p-6',
        className,
      )}
    >
      <h3
        className={cn(
          isPill
            ? 'text-headline-lg-mobile text-on-surface'
            : 'text-label-md mb-4 tracking-wider text-on-surface-variant uppercase',
        )}
      >
        Coupons & Offers
      </h3>

      {appliedCode ? (
        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary-fixed/10 px-4 py-3',
            isPill && 'shadow-[0px_4px_20px_rgba(0,0,0,0.05)]',
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="material-symbols-outlined text-primary">verified</span>
            <div className="min-w-0">
              <p className="text-body-md font-bold text-on-surface">{appliedCode}</p>
              <p className="text-label-md text-primary">Coupon applied</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => removeCoupon.mutate()}
            className="text-label-md shrink-0 font-bold text-error hover:underline disabled:opacity-60"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <div
            className={cn(
              'flex gap-2',
              isPill
                ? 'rounded-full border border-outline-variant bg-surface-container-lowest p-2 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]'
                : 'lg:gap-3',
            )}
          >
            <div className="relative min-w-0 flex-1">
              <span
                className={cn(
                  'material-symbols-outlined pointer-events-none absolute top-1/2 -translate-y-1/2 text-[20px] text-outline',
                  isPill ? 'left-2 text-primary' : 'left-3 lg:left-4',
                )}
              >
                sell
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleApply()
                  }
                }}
                placeholder={isPill ? 'Apply Coupon' : 'Enter coupon code'}
                disabled={isBusy}
                className={cn(
                  'w-full text-body-md text-on-surface uppercase placeholder:normal-case focus:outline-none disabled:opacity-60',
                  isPill
                    ? 'rounded-full border-none bg-transparent py-3 pr-4 pl-10 font-normal focus:ring-0'
                    : 'rounded-full border border-outline-variant/30 bg-surface-container-low py-3 pr-4 pl-11 font-bold placeholder:font-normal focus:border-primary focus:ring-2 focus:ring-primary/20 lg:rounded-xl lg:py-3.5 lg:pl-12',
                )}
              />
            </div>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleApply()}
              className={cn(
                'shrink-0 font-bold transition-colors active:scale-[0.98] disabled:opacity-60',
                isPill
                  ? 'text-label-md rounded-full bg-secondary px-5 py-3 tracking-wider text-white uppercase hover:bg-secondary-container'
                  : 'rounded-full bg-secondary px-5 py-3 text-label-md text-white hover:bg-secondary-container lg:rounded-xl lg:px-6',
              )}
            >
              {applyCoupon.isPending ? '…' : 'Apply'}
            </button>
          </div>

          {couponHint ? (
            <p className="text-label-md mt-3 flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">info</span>
              {couponHint}
            </p>
          ) : null}

          {hasOffers ? (
            <div className="mt-4 space-y-4">
              {platform.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-label-md flex items-center gap-1 font-bold tracking-wider text-on-surface-variant uppercase">
                    <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                    Platform offers
                  </p>
                  {platform.map((coupon) => (
                    <CouponOfferRow
                      key={coupon.uuid}
                      coupon={coupon}
                      disabled={isBusy}
                      onApply={(c) => handleApply(c)}
                    />
                  ))}
                </div>
              ) : null}
              {store.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-label-md flex items-center gap-1 font-bold tracking-wider text-on-surface-variant uppercase">
                    <span className="material-symbols-outlined text-[16px] text-primary">storefront</span>
                    Store offers
                  </p>
                  {store.map((coupon) => (
                    <CouponOfferRow
                      key={coupon.uuid}
                      coupon={coupon}
                      disabled={isBusy}
                      onApply={(c) => handleApply(c)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {formError ? <p className="mt-3 text-body-md text-error">{formError}</p> : null}
    </section>
  )
}
