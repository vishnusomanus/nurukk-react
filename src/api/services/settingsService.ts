import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type Setting = {
  key: string
  value: unknown
  [key: string]: unknown
}

export type SettingsMap = Record<string, unknown>

export type UpdateSettingsPayload = {
  settings: Array<{ key: string; value: unknown }>
}

export async function listSettings() {
  const { data } = await apiClient.get<GenericSuccess<SettingsMap>>('/v1/settings')
  return data
}

export async function updateSettings(payload: UpdateSettingsPayload) {
  const { data } = await apiClient.patch<GenericSuccess<SettingsMap>>('/v1/settings', payload)
  return data
}
