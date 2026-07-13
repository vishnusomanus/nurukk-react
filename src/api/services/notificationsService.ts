import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type AppNotification = {
  uuid: string
  title?: string
  body?: string
  type?: string
  category?: string
  is_read?: boolean
  created_at?: string
  image_url?: string | null
  deep_link?: string | null
  data?: Record<string, unknown>
}

export async function listNotifications(params?: {
  page?: number
  per_page?: number
  unread_only?: boolean
}) {
  const { data } = await apiClient.get<GenericSuccess<AppNotification[]>>('/v1/notifications', { params })
  return data
}

export async function getUnreadCount() {
  const { data } = await apiClient.get<GenericSuccess<{ count: number }>>('/v1/notifications/unread-count')
  return data
}

export async function markAllRead() {
  const { data } = await apiClient.patch<GenericSuccess<{ updated: number }>>('/v1/notifications/read-all')
  return data
}

export async function markAsRead(uuid: string) {
  const { data } = await apiClient.patch<GenericSuccess<AppNotification>>(`/v1/notifications/${uuid}/read`)
  return data
}

export async function registerDeviceToken(payload: {
  token: string
  platform: 'android' | 'ios' | 'web'
  app: 'buyer' | 'seller' | 'delivery'
  device_id?: string
  locale?: string
}) {
  const { data } = await apiClient.post<GenericSuccess>('/v1/notifications/device-token', payload)
  return data
}

export async function unregisterDeviceToken(token: string) {
  const { data } = await apiClient.delete<GenericSuccess>('/v1/notifications/device-token', {
    data: { token },
  })
  return data
}

export async function getPreferences() {
  const { data } = await apiClient.get<GenericSuccess<{ preferences: Record<string, boolean> }>>(
    '/v1/notifications/preferences',
  )
  return data
}

export async function updatePreferences(preferences: Record<string, boolean>) {
  const { data } = await apiClient.put<GenericSuccess<{ preferences: Record<string, boolean> }>>(
    '/v1/notifications/preferences',
    { preferences },
  )
  return data
}

export async function trackOpen(uuid: string) {
  const { data } = await apiClient.post<GenericSuccess>(`/v1/notifications/${uuid}/open`)
  return data
}

export async function trackClick(uuid: string) {
  const { data } = await apiClient.post<GenericSuccess>(`/v1/notifications/${uuid}/click`)
  return data
}

export async function heartbeat() {
  const { data } = await apiClient.post<GenericSuccess>('/v1/notifications/heartbeat')
  return data
}
