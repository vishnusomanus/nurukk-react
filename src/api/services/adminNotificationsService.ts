import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type NotificationCampaign = {
  uuid: string
  title?: string
  body?: string
  image_url?: string | null
  deep_link?: string | null
  category?: string
  audience?: string
  audience_filters?: Record<string, unknown> | null
  status?: string
  scheduled_at?: string | null
  sent_at?: string | null
  target_count?: number
  sent_count?: number
  failed_count?: number
  opened_count?: number
  clicked_count?: number
  created_at?: string
}

export type NotificationTemplate = {
  uuid: string
  name?: string
  category?: string
  title?: string
  body?: string
  image_url?: string | null
  deep_link?: string | null
  locale?: string
  is_active?: boolean
  created_at?: string
}

export type NotificationAutomation = {
  uuid: string
  name?: string
  trigger?: string
  audience?: string
  title?: string
  body?: string
  image_url?: string | null
  deep_link?: string | null
  category?: string
  delay_minutes?: number
  is_active?: boolean
  last_run_at?: string | null
}

export type NotificationAnalytics = {
  device_tokens?: number
  campaigns?: number
  total_notifications_sent?: number
  delivered_count?: number
  failed_count?: number
  opened_count?: number
  clicked_count?: number
  open_rate?: number
  click_through_rate?: number
}

export async function getAnalytics() {
  const { data } = await apiClient.get<GenericSuccess<NotificationAnalytics>>(
    '/v1/admin/notifications/analytics',
  )
  return data
}

export async function listCampaigns(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<NotificationCampaign[]>>(
    '/v1/admin/notifications/campaigns',
    { params },
  )
  return data
}

export async function createCampaign(payload: {
  title: string
  body: string
  audience: string
  category?: string
  image_url?: string
  deep_link?: string
  scheduled_at?: string
  send_now?: boolean
  audience_filters?: Record<string, unknown>
  template_uuid?: string
}) {
  const { data } = await apiClient.post<GenericSuccess<NotificationCampaign>>(
    '/v1/admin/notifications/campaigns',
    payload,
  )
  return data
}

export async function sendCampaign(uuid: string) {
  const { data } = await apiClient.post<GenericSuccess<NotificationCampaign>>(
    `/v1/admin/notifications/campaigns/${uuid}/send`,
  )
  return data
}

export async function listTemplates(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<NotificationTemplate[]>>(
    '/v1/admin/notifications/templates',
    { params },
  )
  return data
}

export async function createTemplate(payload: {
  name: string
  title: string
  body: string
  category?: string
  image_url?: string
  deep_link?: string
  locale?: string
}) {
  const { data } = await apiClient.post<GenericSuccess<NotificationTemplate>>(
    '/v1/admin/notifications/templates',
    payload,
  )
  return data
}

export async function listAutomations() {
  const { data } = await apiClient.get<GenericSuccess<{ items: NotificationAutomation[] }>>(
    '/v1/admin/notifications/automations',
  )
  return data
}

export async function createAutomation(payload: {
  name: string
  trigger: string
  title: string
  body: string
  audience?: string
  category?: string
  deep_link?: string
  is_active?: boolean
}) {
  const { data } = await apiClient.post<GenericSuccess<NotificationAutomation>>(
    '/v1/admin/notifications/automations',
    payload,
  )
  return data
}

export async function updateAutomation(
  uuid: string,
  payload: Partial<{
    name: string
    trigger: string
    title: string
    body: string
    is_active: boolean
    deep_link: string
  }>,
) {
  const { data } = await apiClient.put<GenericSuccess<NotificationAutomation>>(
    `/v1/admin/notifications/automations/${uuid}`,
    payload,
  )
  return data
}

export async function deleteAutomation(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess>(`/v1/admin/notifications/automations/${uuid}`)
  return data
}
