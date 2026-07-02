import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type DeliveryZone = {
  id: number
  pincode?: string
  city?: string
  delivery_charge?: number
  is_serviceable?: boolean
}

export type DeliveryModuleSettings = {
  enabled?: boolean
  default_delivery_charge?: number
  per_km_rate?: number
  max_delivery_radius_km?: number
  rain_mode_enabled?: boolean
  rain_surcharge_percent?: number
  zones?: DeliveryZone[]
  [key: string]: unknown
}

export async function getDeliverySettings() {
  const { data } = await apiClient.get<GenericSuccess<DeliveryModuleSettings>>('/v1/admin/delivery')
  return data
}

export async function updateDeliveryModule(payload: { enabled: boolean }) {
  const { data } = await apiClient.patch<GenericSuccess<DeliveryModuleSettings>>('/v1/admin/delivery', payload)
  return data
}

export async function updateDeliveryPricing(payload: {
  delivery_charge?: number
  delivery_per_km_rate?: number
  max_delivery_radius_km?: number
  rain_mode_enabled?: boolean
  rain_surcharge_percent?: number
}) {
  const { data } = await apiClient.patch<GenericSuccess<DeliveryModuleSettings>>(
    '/v1/admin/delivery/pricing',
    payload,
  )
  return data
}

export async function createZone(payload: {
  pincode: string
  city?: string
  delivery_charge?: number
  is_serviceable?: boolean
}) {
  const { data } = await apiClient.post<GenericSuccess<DeliveryZone>>('/v1/admin/delivery/zones', payload)
  return data
}

export async function updateZone(id: number, payload: Partial<DeliveryZone>) {
  const { data } = await apiClient.patch<GenericSuccess<DeliveryZone>>(`/v1/admin/delivery/zones/${id}`, payload)
  return data
}

export async function deleteZone(id: number) {
  const { data } = await apiClient.delete<GenericSuccess>(`/v1/admin/delivery/zones/${id}`)
  return data
}
