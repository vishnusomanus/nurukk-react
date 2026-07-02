import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type AdminBanner = {
  id: number
  title: string
  image_url: string
  sort_order?: number
  is_active?: boolean
}

export type AdminFeaturedProduct = {
  id: number
  product_uuid?: string
  sort_order?: number
  is_active?: boolean
  product?: { uuid?: string; name?: string; image_url?: string | null }
}

export async function listBanners() {
  const { data } = await apiClient.get<GenericSuccess<AdminBanner[]>>('/v1/admin/banners')
  return data
}

export async function createBanner(payload: {
  title: string
  image_url: string
  sort_order?: number
  is_active?: boolean
}) {
  const { data } = await apiClient.post<GenericSuccess<AdminBanner>>('/v1/admin/banners', payload)
  return data
}

export async function updateBanner(id: number, payload: Partial<AdminBanner>) {
  const { data } = await apiClient.patch<GenericSuccess<AdminBanner>>(`/v1/admin/banners/${id}`, payload)
  return data
}

export async function deleteBanner(id: number) {
  const { data } = await apiClient.delete<GenericSuccess>(`/v1/admin/banners/${id}`)
  return data
}

export async function listFeaturedProducts() {
  const { data } = await apiClient.get<GenericSuccess<AdminFeaturedProduct[]>>('/v1/admin/featured-products')
  return data
}

export async function createFeaturedProduct(payload: {
  product_uuid: string
  sort_order?: number
  is_active?: boolean
}) {
  const { data } = await apiClient.post<GenericSuccess<AdminFeaturedProduct>>(
    '/v1/admin/featured-products',
    payload,
  )
  return data
}

export async function updateFeaturedProduct(
  id: number,
  payload: Partial<{ sort_order: number; is_active: boolean }>,
) {
  const { data } = await apiClient.patch<GenericSuccess<AdminFeaturedProduct>>(
    `/v1/admin/featured-products/${id}`,
    payload,
  )
  return data
}

export async function deleteFeaturedProduct(id: number) {
  const { data } = await apiClient.delete<GenericSuccess>(`/v1/admin/featured-products/${id}`)
  return data
}
