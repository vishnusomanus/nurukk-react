import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'

export type AdminOrderParty = {
  uuid?: string
  name?: string
  phone?: string
  email?: string
  store_name?: string
  city?: string
  pincode?: string
}

export type AdminOrderItem = {
  product_name?: string
  product_unit?: string
  unit_price?: number
  quantity?: number
  subtotal?: number
  product?: { uuid?: string; name?: string; image_url?: string | null; unit?: string }
}

export type AdminOrderAddress = {
  label?: string | null
  address_line?: string | null
  city?: string | null
  pincode?: string | null
  latitude?: number | null
  longitude?: number | null
}

export type AdminOrderPayment = {
  uuid?: string
  status?: string
  amount?: number
  currency?: string
  payment_method?: string
  gateway?: string | null
  gateway_order_id?: string | null
  gateway_payment_id?: string | null
}

export type AdminOrderTimelineEntry = {
  status: string
  at: string
}

export type AdminOrderRefund = {
  uuid?: string
  amount?: number
  status?: string
  reason?: string | null
  created_at?: string
}

export type AdminOrderSettlement = {
  payee_type?: string
  amount?: number
  description?: string | null
  payout_uuid?: string | null
  payout_status?: string | null
  payout_reference?: string | null
  processed_at?: string | null
}

export type AdminOrder = {
  uuid: string
  order_number?: string
  status: string
  subtotal?: number
  delivery_charge?: number
  platform_fee?: number
  delivery_type?: string | null
  distance_km?: number | null
  delivery_base_charge?: number
  delivery_distance_charge?: number
  delivery_rain_surcharge?: number
  discount?: number
  total?: number
  payment_method?: string
  payment_status?: string
  coupon_code?: string | null
  notes?: string | null
  invoice_url?: string | null
  created_at?: string
  updated_at?: string
  buyer?: AdminOrderParty
  seller?: AdminOrderParty
  delivery_agent?: AdminOrderParty
  address?: AdminOrderAddress
  items?: AdminOrderItem[]
  payment?: AdminOrderPayment
  timeline?: AdminOrderTimelineEntry[]
  refunds?: AdminOrderRefund[]
  settlements?: AdminOrderSettlement[]
  tracking?: Record<string, unknown>
  [key: string]: unknown
}

export type ListOrdersParams = {
  page?: number
  per_page?: number
  status?: string
}

export const ADMIN_ORDER_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'packed',
  'ready_for_delivery',
  'at_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const

export async function listOrders(params?: ListOrdersParams) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<AdminOrder>>>('/v1/admin/orders', {
    params,
  })
  return data
}

export async function getOrder(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<AdminOrder>>(`/v1/admin/orders/${uuid}`)
  return data
}

export async function updateOrderStatus(uuid: string, status: string) {
  const { data } = await apiClient.patch<GenericSuccess>(`/v1/admin/orders/${uuid}/status`, { status })
  return data
}

export async function refundOrder(uuid: string, reason?: string) {
  const { data } = await apiClient.post<GenericSuccess>(`/v1/admin/orders/${uuid}/refund`, { reason })
  return data
}
