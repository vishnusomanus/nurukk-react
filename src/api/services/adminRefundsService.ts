import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'

export type AdminRefund = {
  uuid?: string
  order_uuid?: string
  amount?: number
  status?: string
  created_at?: string
  [key: string]: unknown
}

export async function listRefunds(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<AdminRefund> | AdminRefund[]>>(
    '/v1/admin/refunds',
    { params },
  )
  return data
}
