import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'

export type AdminCategory = {
  uuid: string
  name: string
  slug?: string
  is_active?: boolean
  show_in_menu?: boolean
  menu_sort_order?: number
  [key: string]: unknown
}

export type CategoryPayload = {
  name?: string
  slug?: string
  is_active?: boolean
  show_in_menu?: boolean
  menu_sort_order?: number
  image_url?: string | null
}

export async function listCategories() {
  const { data } = await apiClient.get<GenericSuccess<Paginated<AdminCategory> | AdminCategory[]>>(
    '/v1/admin/categories',
  )
  return data
}

export async function createCategory(payload: CategoryPayload) {
  const { data } = await apiClient.post<GenericSuccess<AdminCategory>>('/v1/admin/categories', payload)
  return data
}

export async function updateCategory(uuid: string, payload: CategoryPayload) {
  const { data } = await apiClient.put<GenericSuccess<AdminCategory>>(
    `/v1/admin/categories/${uuid}`,
    payload,
  )
  return data
}

export async function deleteCategory(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess>(`/v1/admin/categories/${uuid}`)
  return data
}
