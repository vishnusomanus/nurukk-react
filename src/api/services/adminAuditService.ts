import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'

export type AuditLogActor = {
  id?: number
  uuid?: string
  name?: string | null
  email?: string | null
  role?: string | null
}

export type AuditLogEntry = {
  id: number
  action?: string
  action_label?: string
  entity?: string
  entity_id?: number | null
  summary?: string
  change_log?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
  created_at?: string
  actor?: AuditLogActor | null
}

export async function listAuditLogs(params?: {
  page?: number
  per_page?: number
  action?: string
  entity?: string
  search?: string
}) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<AuditLogEntry> | AuditLogEntry[]>>(
    '/v1/admin/audit-logs',
    { params },
  )
  return data
}
