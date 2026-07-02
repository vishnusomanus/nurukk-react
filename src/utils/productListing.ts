import type { BuyerProduct } from '@/api/services/buyerService'

export type ProductSort = 'featured' | 'price_asc' | 'price_desc' | 'newest'

type ProductTagEntry = { value: string; label: string }

export function getProductTags(product: Record<string, unknown>): ProductTagEntry[] {
  const raw = product.tags
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (tag): tag is ProductTagEntry =>
      typeof tag === 'object' &&
      tag !== null &&
      typeof (tag as ProductTagEntry).value === 'string',
  )
}

export function productHasTag(product: BuyerProduct, tagValue: string) {
  return getProductTags(product).some((tag) => tag.value === tagValue)
}

export function getProductDisplayPrice(product: BuyerProduct) {
  return product.discount_price ?? product.price
}

export type ProductListingBadge = {
  value: string
  label: string
  style: 'primary' | 'secondary' | 'tertiary' | 'neutral'
}

const BADGE_STYLE_CLASSES: Record<ProductListingBadge['style'], string> = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary text-white',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  neutral: 'bg-surface-container-high text-on-surface-variant',
}

export function getProductListingBadge(product: BuyerProduct): ProductListingBadge | null {
  const raw = product.listing_badge
  if (!raw || typeof raw !== 'object' || raw === null) return null

  const badge = raw as Record<string, unknown>
  const value = typeof badge.value === 'string' ? badge.value : ''
  const label = typeof badge.label === 'string' ? badge.label : ''
  const style = badge.style

  if (!value || !label) return null

  const resolvedStyle =
    style === 'primary' || style === 'secondary' || style === 'tertiary' || style === 'neutral'
      ? style
      : 'neutral'

  return { value, label, style: resolvedStyle }
}

export function getProductListingBadgeClassName(badge: ProductListingBadge) {
  return BADGE_STYLE_CLASSES[badge.style]
}

export function sortProducts(products: BuyerProduct[], sort: ProductSort) {
  const list = [...products]

  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => getProductDisplayPrice(a) - getProductDisplayPrice(b))
    case 'price_desc':
      return list.sort((a, b) => getProductDisplayPrice(b) - getProductDisplayPrice(a))
    case 'newest':
      return list.reverse()
    default:
      return list
  }
}

export function filterProductsByDietary(
  products: BuyerProduct[],
  { organic, locallySourced }: { organic: boolean; locallySourced: boolean },
) {
  if (!organic && !locallySourced) return products

  return products.filter((product) => {
    if (organic && !productHasTag(product, 'organic')) return false
    if (locallySourced && !productHasTag(product, 'locally_sourced')) return false
    return true
  })
}
