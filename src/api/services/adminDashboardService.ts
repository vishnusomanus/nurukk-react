import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'

import type { AdminPayoutStatistics } from '@/types/payout'

export type AdminDashboardStats = {
  total_orders?: number
  total_sales?: number
  active_sellers?: number
  active_buyers?: number
  payouts?: AdminPayoutStatistics
  [key: string]: unknown
}

export async function getDashboard() {
  const { data } = await apiClient.get<GenericSuccess<AdminDashboardStats>>('/v1/admin/dashboard')
  return data
}
