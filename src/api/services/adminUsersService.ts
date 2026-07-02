import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'

export type AdminUserStats = {
  orders_as_buyer?: number
  orders_as_seller?: number
  deliveries?: number
  products?: number
  addresses?: number
  notifications?: number
}

export type AdminUser = {
  uuid: string
  name?: string | null
  email?: string | null
  phone?: string | null
  role: string
  is_blocked?: boolean
  block_reason?: string | null
  created_at?: string
  updated_at?: string
  email_verified_at?: string | null
  seller_store?: string | null
  seller_status?: string | null
  stats?: AdminUserStats
  seller_profile?: Record<string, unknown> | null
  delivery_profile?: Record<string, unknown> | null
  payout_account?: Record<string, unknown> | null
  recent_orders?: {
    as_buyer?: Array<Record<string, unknown>>
    as_seller?: Array<Record<string, unknown>>
  }
  [key: string]: unknown
}

export type ListUsersParams = {
  page?: number
  per_page?: number
  search?: string
  role?: string
  status?: 'active' | 'blocked' | ''
}

export const ADMIN_USER_ROLES = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'customer', label: 'Customer' },
  { value: 'seller', label: 'Seller' },
  { value: 'delivery_agent', label: 'Delivery agent' },
  { value: 'seller_delivery', label: 'Seller delivery' },
] as const

export async function listUsers(params?: ListUsersParams) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<AdminUser>>>('/v1/admin/users', {
    params,
  })
  return data
}

export async function getUser(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<AdminUser>>(`/v1/admin/users/${uuid}`)
  return data
}

export async function blockUser(uuid: string, reason?: string) {
  const { data } = await apiClient.patch<GenericSuccess>(`/v1/admin/users/${uuid}/block`, {
    is_blocked: true,
    reason,
  })
  return data
}

export async function unblockUser(uuid: string) {
  const { data } = await apiClient.patch<GenericSuccess>(`/v1/admin/users/${uuid}/block`, {
    is_blocked: false,
  })
  return data
}
