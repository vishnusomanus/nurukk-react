import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'

export type CouponIssuer = 'platform' | 'seller'

export type CouponUserEligibility =
  | 'all'
  | 'first_order'
  | 'new_users'
  | 'returning'
  | 'specific_users'

export type CouponSellerSummary = {
  uuid: string
  store_name: string
}

export type AdminCoupon = {
  uuid: string
  code: string
  title?: string | null
  issuer: CouponIssuer
  type: string
  value: number
  min_order_amount?: number
  max_discount?: number | null
  starts_at?: string | null
  expires_at?: string | null
  usage_limit?: number | null
  per_user_usage_limit?: number | null
  used_count?: number
  user_eligibility?: CouponUserEligibility
  new_user_within_days?: number | null
  allowed_user_uuids?: string[] | null
  is_active?: boolean
  seller?: CouponSellerSummary | null
}

export type CouponPayload = {
  code: string
  title?: string | null
  type: string
  value: number
  min_order_amount?: number
  max_discount?: number | null
  starts_at?: string | null
  expires_at?: string | null
  usage_limit?: number | null
  per_user_usage_limit?: number | null
  user_eligibility?: CouponUserEligibility
  new_user_within_days?: number | null
  allowed_user_uuids?: string[]
  is_active?: boolean
}

export async function listCoupons(params?: {
  page?: number
  per_page?: number
  issuer?: CouponIssuer | 'all'
  search?: string
}) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<AdminCoupon>>>('/v1/admin/coupons', {
    params: {
      ...params,
      issuer: params?.issuer === 'all' ? undefined : params?.issuer,
    },
  })
  return data
}

export async function createCoupon(payload: CouponPayload) {
  const { data } = await apiClient.post<GenericSuccess<AdminCoupon>>('/v1/admin/coupons', payload)
  return data
}

export async function updateCoupon(uuid: string, payload: Partial<CouponPayload>) {
  const { data } = await apiClient.put<GenericSuccess<AdminCoupon>>(`/v1/admin/coupons/${uuid}`, payload)
  return data
}

export async function deleteCoupon(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess>(`/v1/admin/coupons/${uuid}`)
  return data
}

export const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage off' },
  { value: 'flat', label: 'Flat amount off' },
  { value: 'free_delivery', label: 'Free delivery' },
  { value: 'first_order', label: 'First order (platform only)' },
] as const

export const SELLER_COUPON_TYPES = COUPON_TYPES.filter((t) => t.value !== 'first_order')

export const COUPON_USER_ELIGIBILITY = [
  { value: 'all', label: 'All users' },
  { value: 'first_order', label: 'First order only' },
  { value: 'new_users', label: 'New users' },
  { value: 'returning', label: 'Returning customers' },
  { value: 'specific_users', label: 'Specific users (platform only)' },
] as const

export const SELLER_COUPON_USER_ELIGIBILITY = COUPON_USER_ELIGIBILITY.filter(
  (option) => option.value !== 'specific_users',
)
