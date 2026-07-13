import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type SupportApp = 'buyer' | 'seller' | 'delivery'

export type SupportTicketPayload = {
  name: string
  email: string
  mobile: string
  description: string
  screenshot_urls?: string[]
  app?: SupportApp
}

export type SupportTicket = {
  uuid: string
  app: SupportApp | string
  name: string
  email: string
  mobile: string
  description: string
  screenshot_urls?: string[]
  status: string
  admin_notes?: string | null
  created_at?: string | null
}

export async function submitSupportTicket(payload: SupportTicketPayload) {
  const { data } = await apiClient.post<GenericSuccess<SupportTicket>>('/v1/support', payload)
  return data
}
