import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type OrderChatMessage = {
  uuid: string
  body: string
  created_at?: string
  is_mine?: boolean
  sender?: {
    uuid?: string
    name?: string | null
  }
}

export type OrderChatThread = {
  can_send: boolean
  order_uuid: string
  order_number?: string
  messages: OrderChatMessage[]
}

export async function getOrderChat(orderUuid: string) {
  const { data } = await apiClient.get<GenericSuccess<OrderChatThread>>(
    `/v1/orders/${orderUuid}/chat`,
  )
  return data
}

export async function sendOrderChatMessage(orderUuid: string, body: string) {
  const { data } = await apiClient.post<GenericSuccess<OrderChatMessage>>(
    `/v1/orders/${orderUuid}/chat/messages`,
    { body },
  )
  return data
}

/** Statuses where the thread can be opened (send and/or read history). */
export function canOpenOrderChat(status?: string | null) {
  const value = String(status ?? '').toLowerCase()
  return (
    value === 'picked_up' ||
    value === 'package_collected' ||
    value === 'collected' ||
    value === 'out_for_delivery' ||
    value === 'reached_customer' ||
    value === 'at_customer' ||
    value === 'delivered' ||
    value === 'cancelled'
  )
}
