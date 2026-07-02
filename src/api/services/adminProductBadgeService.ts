import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'

export type ProductBadgeRuleSettings = {
  enabled: boolean
  min_units_sold?: number
  min_order_count?: number
  min_delivered_orders?: number
  min_fulfillment_rate?: number
  min_avg_rating?: number
  min_rating_count?: number
  max_account_age_days?: number
  max_delivered_orders?: number
}

export type ProductBadgeSettings = {
  best_seller: ProductBadgeRuleSettings
  premium: ProductBadgeRuleSettings
  top_seller: ProductBadgeRuleSettings
  trusted: ProductBadgeRuleSettings
  new_seller: ProductBadgeRuleSettings
}

export async function getProductBadgeSettings() {
  const { data } = await apiClient.get<GenericSuccess<ProductBadgeSettings>>('/v1/admin/product-badges')
  return data
}

export async function updateProductBadgeSettings(payload: Partial<ProductBadgeSettings>) {
  const { data } = await apiClient.patch<GenericSuccess<ProductBadgeSettings>>(
    '/v1/admin/product-badges',
    payload,
  )
  return data
}
