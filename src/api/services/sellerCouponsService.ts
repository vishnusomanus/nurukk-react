import { apiClient } from '@/api/client'
import type { AdminCoupon, CouponPayload } from '@/api/services/adminCouponsService'
import type { GenericSuccess, Paginated } from '@/types/api'

export type SellerCoupon = AdminCoupon

export async function listSellerCoupons(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<SellerCoupon>>>('/v1/seller/coupons', {
    params,
  })
  return data
}

export async function createSellerCoupon(payload: CouponPayload) {
  const { data } = await apiClient.post<GenericSuccess<SellerCoupon>>('/v1/seller/coupons', payload)
  return data
}

export async function updateSellerCoupon(uuid: string, payload: Partial<CouponPayload>) {
  const { data } = await apiClient.put<GenericSuccess<SellerCoupon>>(`/v1/seller/coupons/${uuid}`, payload)
  return data
}

export async function deleteSellerCoupon(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess>(`/v1/seller/coupons/${uuid}`)
  return data
}
