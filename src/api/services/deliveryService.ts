import { apiClient } from '@/api/client'
import type { BuyerOrder } from '@/api/services/buyerService'
import type { GenericSuccess, Paginated } from '@/types/api'

export type DeliveryProfile = {
  uuid: string
  type?: 'platform_agent' | 'seller_employee'
  display_name?: string
  phone?: string | null
  vehicle_type?: string | null
  latitude?: number | null
  longitude?: number | null
  service_radius_km?: number | null
  is_available?: boolean
  is_active?: boolean
  seller_id?: number | null
  [key: string]: unknown
}

export type UpdateDeliveryProfilePayload = {
  display_name?: string
  phone?: string | null
  vehicle_type?: string | null
  latitude?: number | null
  longitude?: number | null
  service_radius_km?: number | null
  is_available?: boolean
}

export async function registerAgent(payload: {
  display_name: string
  vehicle_type?: string
  service_radius_km?: number
}) {
  const { data } = await apiClient.post<GenericSuccess<DeliveryProfile>>('/v1/delivery/register', payload)
  return data
}

export async function getProfile() {
  const { data } = await apiClient.get<GenericSuccess<DeliveryProfile>>('/v1/delivery/profile')
  return data
}

export async function updateProfile(payload: UpdateDeliveryProfilePayload) {
  const { data } = await apiClient.patch<GenericSuccess<DeliveryProfile>>('/v1/delivery/profile', payload)
  return data
}

export async function pingLocation(payload: { latitude: number; longitude: number }) {
  const { data } = await apiClient.post<
    GenericSuccess<{ latitude: number; longitude: number; location_updated_at?: string | null }>
  >('/v1/delivery/location', payload)
  return data
}

export async function listAssignedOrders(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<BuyerOrder> | BuyerOrder[]>>(
    '/v1/delivery/orders',
    { params },
  )
  return data
}

export async function listAvailableOrders(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<BuyerOrder> | BuyerOrder[]>>(
    '/v1/delivery/orders/available',
    { params },
  )
  return data
}

export async function getOrder(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<BuyerOrder>>(`/v1/delivery/orders/${uuid}`)
  return data
}

export async function acceptOrder(uuid: string) {
  const { data } = await apiClient.post<GenericSuccess<BuyerOrder>>(`/v1/delivery/orders/${uuid}/accept`)
  return data
}

export async function markReachedPickup(uuid: string) {
  const { data } = await apiClient.patch<GenericSuccess<BuyerOrder>>(`/v1/delivery/orders/${uuid}/pickup`)
  return data
}

export async function markPackageCollected(uuid: string) {
  const { data } = await apiClient.patch<GenericSuccess<BuyerOrder>>(`/v1/delivery/orders/${uuid}/collected`)
  return data
}

export async function markReachedCustomer(uuid: string) {
  const { data } = await apiClient.patch<GenericSuccess<BuyerOrder>>(`/v1/delivery/orders/${uuid}/reached`)
  return data
}

export async function markDelivered(uuid: string) {
  const { data } = await apiClient.patch<GenericSuccess<BuyerOrder>>(`/v1/delivery/orders/${uuid}/delivered`)
  return data
}

export type DeliveryOrder = BuyerOrder & {
  items_count?: number
  address?: {
    label?: string
    address_line?: string
    city?: string
    pincode?: string
    latitude?: number | null
    longitude?: number | null
  }
  seller?: {
    name?: string
    phone?: string
    address_line?: string
    city?: string
    pincode?: string
    latitude?: number | null
    longitude?: number | null
  }
  buyer?: {
    name?: string
    phone?: string
  }
}

export type DeliveryHistoryOrder = DeliveryOrder & {
  delivered_at?: string
  earning?: number
}

export type DeliveryDailyEarning = {
  date: string
  label: string
  earnings: number
  deliveries: number
}

export type DeliveryEarningsSummary = {
  period: string
  today_earnings: number
  week_earnings: number
  month_earnings: number
  total_earnings: number
  total_deliveries: number
  period_earnings: number
  period_deliveries: number
  daily_earnings?: DeliveryDailyEarning[]
  payouts?: import('@/types/payout').PayoutSummary
}

export async function listOrderHistory(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<DeliveryHistoryOrder> | DeliveryHistoryOrder[]>>(
    '/v1/delivery/orders/history',
    { params },
  )
  return data
}

export async function getEarnings(period: 'week' | 'month' | 'all' = 'week') {
  const { data } = await apiClient.get<GenericSuccess<DeliveryEarningsSummary>>('/v1/delivery/earnings', {
    params: { period },
  })
  return data
}

export async function getPayoutSummary() {
  const { data } = await apiClient.get<GenericSuccess<import('@/types/payout').PayoutSummary>>('/v1/delivery/payouts/summary')
  return data
}

export async function listPayouts(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<import('@/types/payout').PayoutRecord[]>>('/v1/delivery/payouts', {
    params,
  })
  return data
}

export async function getPayout(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<import('@/types/payout').PayoutRecord>>(
    `/v1/delivery/payouts/${uuid}`,
  )
  return data
}

export async function getPayoutAccount() {
  const { data } = await apiClient.get<GenericSuccess<import('@/types/payout').PayoutAccount | null>>(
    '/v1/delivery/payout-account',
  )
  return data
}

export async function savePayoutAccount(payload: import('@/types/payout').PayoutAccountPayload) {
  const { data } = await apiClient.put<GenericSuccess<import('@/types/payout').PayoutAccount>>(
    '/v1/delivery/payout-account',
    payload,
  )
  return data
}
