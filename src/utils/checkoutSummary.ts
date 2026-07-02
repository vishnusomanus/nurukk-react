import type { CartData, CheckoutPreviewData } from '@/api/services/buyerService'

export type CheckoutTotals = {
  subtotal: number
  delivery: number
  platformFee: number
  discount: number
  total: number
  itemCount: number
}

export function resolveCheckoutTotals(
  preview: CheckoutPreviewData | undefined,
  cart: CartData | undefined,
): CheckoutTotals {
  const source = preview?.cart ?? cart
  const items = source?.items ?? []

  return {
    subtotal: Number(source?.subtotal ?? 0),
    delivery: Number(source?.delivery_charge ?? 0),
    platformFee: Number(source?.platform_fee ?? 0),
    discount: Number(source?.discount ?? 0),
    total: Number(source?.total ?? 0),
    itemCount: items.length,
  }
}
