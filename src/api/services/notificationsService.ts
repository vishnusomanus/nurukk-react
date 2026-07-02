import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type AppNotification = {
  uuid: string
  title?: string
  body?: string
  type?: string
  is_read?: boolean
  created_at?: string
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
