import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'
import type { SupportTicket } from '@/api/services/supportService'

export type AdminSupportTicket = SupportTicket & {
  user?: {
    uuid?: string
    name?: string
    phone?: string
    email?: string
    role?: string
  } | null
  updated_at?: string | null
}

export async function listSupportTickets(params?: {
  page?: number
  per_page?: number
  status?: string
  app?: string
  search?: string
}) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<AdminSupportTicket> | AdminSupportTicket[]>>(
    '/v1/admin/support',
    { params },
  )
  return data
}

export async function getSupportTicket(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<AdminSupportTicket>>(`/v1/admin/support/${uuid}`)
  return data
}

export async function updateSupportTicket(
  uuid: string,
  payload: { status?: string; admin_notes?: string | null },
) {
  const { data } = await apiClient.patch<GenericSuccess<AdminSupportTicket>>(
    `/v1/admin/support/${uuid}`,
    payload,
  )
  return data
}
