import type { CartData } from '@/api/services/buyerService'
import type { GenericSuccess } from '@/types/api'

export function getCartBadgeCount(cart: GenericSuccess<CartData> | undefined): number {
  const items = cart?.data?.items ?? []
  return items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
}
