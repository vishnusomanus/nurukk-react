import type { BuyerProduct } from '@/api/services/buyerService'

export function getSellerStorePath(product: BuyerProduct): string | null {
  const sellerUuid = product.seller?.uuid
  if (typeof sellerUuid !== 'string' || !sellerUuid) return null
  return `/buyer/stores/${sellerUuid}`
}

export function getProductDetailPath(productUuid: string) {
  return `/buyer/products/${productUuid}`
}
