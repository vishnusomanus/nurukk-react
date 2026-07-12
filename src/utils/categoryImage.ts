import type { BuyerCategory, BuyerProduct } from '@/api/services/buyerService'

export function pickProductImageUrl(product?: BuyerProduct | null): string | undefined {
  if (!product) return undefined
  if (typeof product.image_url === 'string' && product.image_url.trim()) {
    return product.image_url.trim()
  }
  if (Array.isArray(product.images) && product.images[0]) {
    const first = String(product.images[0]).trim()
    if (first) return first
  }
  return undefined
}

/** Prefer category image, then sample product image attached by home enrichment / API. */
export function getCategoryImageUrl(category?: BuyerCategory | null): string | undefined {
  if (!category) return undefined
  const direct = category.image_url
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  const fromProduct = category.product_image_url
  if (typeof fromProduct === 'string' && fromProduct.trim()) return fromProduct.trim()
  return undefined
}
