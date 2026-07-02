import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'
import type { AdminPayoutRecord, AdminPayoutStatistics } from '@/types/payout'

export async function getStatistics() {
  const { data } = await apiClient.get<GenericSuccess<AdminPayoutStatistics>>('/v1/admin/payouts/statistics')
  return data
}

export async function listPayouts(params?: {
  page?: number
  per_page?: number
  status?: string
  payee_type?: string
}) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<AdminPayoutRecord> | AdminPayoutRecord[]>>(
    '/v1/admin/payouts',
    { params },
  )
  return data
}

export async function getPayout(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<AdminPayoutRecord>>(`/v1/admin/payouts/${uuid}`)
  return data
}

export async function runDeliveryPayouts(date?: string) {
  const { data } = await apiClient.post<GenericSuccess<unknown>>('/v1/admin/payouts/run-delivery', { date })
  return data
}

export async function runSellerPayouts() {
  const { data } = await apiClient.post<GenericSuccess<unknown>>('/v1/admin/payouts/run-sellers')
  return data
}
