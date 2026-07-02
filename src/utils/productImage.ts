import type { BuyerProduct } from '@/api/services/buyerService'

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#e3e2e2" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#707a6c" font-family="sans-serif" font-size="14">No image</text></svg>`,
  )

export function getProductImage(product?: BuyerProduct | null) {
  if (!product) return PLACEHOLDER
  if (typeof product.image_url === 'string' && product.image_url) return product.image_url
  if (Array.isArray(product.images) && product.images[0]) return String(product.images[0])
  return PLACEHOLDER
}
