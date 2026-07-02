import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type AdminProductTag = {
  uuid: string
  value: string
  label: string
  is_active?: boolean
  sort_order?: number
}

export type ProductTagPayload = {
  label?: string
  value?: string
  is_active?: boolean
  sort_order?: number
}

export async function listProductTags() {
  const { data } = await apiClient.get<GenericSuccess<AdminProductTag[]>>('/v1/admin/product-tags')
  return data
}

export async function createProductTag(payload: ProductTagPayload) {
  const { data } = await apiClient.post<GenericSuccess<AdminProductTag>>('/v1/admin/product-tags', payload)
  return data
}

export async function updateProductTag(uuid: string, payload: ProductTagPayload) {
  const { data } = await apiClient.put<GenericSuccess<AdminProductTag>>(
    `/v1/admin/product-tags/${uuid}`,
    payload,
  )
  return data
}

export async function deleteProductTag(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess>(`/v1/admin/product-tags/${uuid}`)
  return data
}
