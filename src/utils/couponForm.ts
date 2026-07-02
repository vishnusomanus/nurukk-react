import type { CouponPayload, CouponUserEligibility } from '@/api/services/adminCouponsService'

export type CouponFormState = {
  code: string
  title: string
  type: string
  value: string
  minOrder: string
  maxDiscount: string
  usageLimit: string
  perUserUsageLimit: string
  startsAt: string
  expiresAt: string
  userEligibility: string
  newUserWithinDays: string
  allowedUserUuids: string
}

export const defaultCouponFormState = (): CouponFormState => ({
  code: '',
  title: '',
  type: 'percentage',
  value: '10',
  minOrder: '0',
  maxDiscount: '',
  usageLimit: '',
  perUserUsageLimit: '1',
  startsAt: '',
  expiresAt: '',
  userEligibility: 'all',
  newUserWithinDays: '30',
  allowedUserUuids: '',
})

export function couponFormToPayload(form: CouponFormState): CouponPayload {
  const allowed = form.allowedUserUuids
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    code: form.code.trim().toUpperCase(),
    title: form.title.trim() || undefined,
    type: form.type,
    value: Number(form.value) || 0,
    min_order_amount: Number(form.minOrder) || 0,
    max_discount: form.maxDiscount.trim() ? Number(form.maxDiscount) : null,
    usage_limit: form.usageLimit.trim() ? Number(form.usageLimit) : null,
    per_user_usage_limit: form.perUserUsageLimit.trim() ? Number(form.perUserUsageLimit) : null,
    starts_at: form.startsAt.trim() ? new Date(form.startsAt).toISOString() : null,
    expires_at: form.expiresAt.trim() ? new Date(form.expiresAt).toISOString() : null,
    user_eligibility: form.userEligibility as CouponUserEligibility,
    new_user_within_days:
      form.userEligibility === 'new_users' ? Number(form.newUserWithinDays) || 30 : null,
    allowed_user_uuids:
      form.userEligibility === 'specific_users' && allowed.length > 0 ? allowed : undefined,
    is_active: true,
  }
}

export function resetCouponFormFields(setter: (fn: (prev: CouponFormState) => CouponFormState) => void) {
  setter((prev) => ({
    ...defaultCouponFormState(),
    type: prev.type,
  }))
}
