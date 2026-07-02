import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'

export type AdminSeller = {
  uuid: string
  name: string
  description?: string | null
  city?: string | null
  pincode?: string | null
  phone?: string | null
  status: string
  approval_notes?: string | null
  email?: string
  [key: string]: unknown
}

export type ListSellersParams = {
  page?: number
  per_page?: number
  status?: string
}

export async function listSellers(params?: ListSellersParams) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<AdminSeller>>>('/v1/admin/sellers', {
    params,
  })
  return data
}

export async function approveSeller(uuid: string) {
  const { data } = await apiClient.post<GenericSuccess>(`/v1/admin/sellers/${uuid}/approve`)
  return data
}

export async function rejectSeller(uuid: string) {
  const { data } = await apiClient.post<GenericSuccess>(`/v1/admin/sellers/${uuid}/reject`)
  return data
}
