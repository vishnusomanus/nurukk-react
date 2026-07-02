import type { AdminCoupon } from '@/api/services/adminCouponsService'
import type { BuyerCoupon } from '@/api/services/buyerService'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'

type CouponLike = Pick<
  BuyerCoupon | AdminCoupon,
  | 'type'
  | 'value'
  | 'code'
  | 'max_discount'
  | 'min_order_amount'
  | 'starts_at'
  | 'expires_at'
  | 'usage_limit'
  | 'used_count'
  | 'per_user_usage_limit'
  | 'user_eligibility'
  | 'new_user_within_days'
  | 'issuer'
  | 'seller'
  | 'title'
>

const ELIGIBILITY_LABELS: Record<string, string> = {
  all: 'All users',
  first_order: 'First order only',
  new_users: 'New users',
  returning: 'Returning customers',
  specific_users: 'Selected users only',
}

export function formatCouponBenefit(coupon: Pick<CouponLike, 'type' | 'value' | 'code' | 'max_discount'>): string {
  switch (coupon.type) {
    case 'percentage': {
      const cap =
        coupon.max_discount != null && coupon.max_discount > 0
          ? ` (max ${formatCurrency(coupon.max_discount)})`
          : ''
      return `${coupon.value}% off${cap}`
    }
    case 'flat':
    case 'first_order':
      return `${formatCurrency(coupon.value)} off`
    case 'free_delivery':
      return 'Free delivery'
    default:
      return coupon.code
  }
}

export function formatCouponHint(coupon: BuyerCoupon): string {
  const benefit = formatCouponBenefit(coupon)
  const label = coupon.title?.trim() || coupon.code

  if (coupon.issuer === 'seller' && coupon.seller?.store_name) {
    return `${benefit} from ${coupon.seller.store_name} — use ${coupon.code}`
  }

  return `${benefit} with ${label} (${coupon.code})`
}

export function couponIssuerLabel(coupon: Pick<CouponLike, 'issuer' | 'seller'>): string {
  if (coupon.issuer === 'seller' && coupon.seller?.store_name) {
    return coupon.seller.store_name
  }

  return 'Platform offer'
}

export function formatCouponValidity(coupon: Pick<CouponLike, 'starts_at' | 'expires_at'>): string | null {
  const parts: string[] = []

  if (coupon.starts_at) {
    parts.push(`From ${formatOrderDateTime(coupon.starts_at)}`)
  }

  if (coupon.expires_at) {
    parts.push(`Until ${formatOrderDateTime(coupon.expires_at)}`)
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

export function formatCouponUsageSummary(
  coupon: Pick<CouponLike, 'usage_limit' | 'used_count' | 'per_user_usage_limit'>,
): string | null {
  const parts: string[] = []

  if (coupon.usage_limit != null) {
    parts.push(`${coupon.used_count ?? 0}/${coupon.usage_limit} total uses`)
  }

  if (coupon.per_user_usage_limit != null) {
    parts.push(`${coupon.per_user_usage_limit} per user`)
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

export function formatCouponEligibility(
  coupon: Pick<CouponLike, 'user_eligibility' | 'new_user_within_days' | 'issuer'>,
): string | null {
  const key = coupon.user_eligibility ?? 'all'

  if (key === 'all') {
    return null
  }

  if (key === 'new_users') {
    return `New users (${coupon.new_user_within_days ?? 30} days)`
  }

  if (key === 'returning') {
    return coupon.issuer === 'seller' ? 'Returning store customers' : 'Returning customers'
  }

  return ELIGIBILITY_LABELS[key] ?? key
}

export function formatCouponMeta(coupon: CouponLike): string {
  return [
    formatCouponValidity(coupon),
    formatCouponUsageSummary(coupon),
    formatCouponEligibility(coupon),
    (coupon.min_order_amount ?? 0) > 0 ? `Min order ${formatCurrency(coupon.min_order_amount ?? 0)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function groupCouponsByIssuer(coupons: BuyerCoupon[]) {
  const platform = coupons.filter((c) => c.issuer !== 'seller')
  const store = coupons.filter((c) => c.issuer === 'seller')

  return { platform, store }
}
