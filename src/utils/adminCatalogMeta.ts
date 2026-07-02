import type { AdminCategory } from '@/api/services/adminCategoriesService'
import type { BuyerProduct } from '@/api/services/buyerService'
import { getProductTags } from '@/utils/productListing'

const CATEGORY_ICON_RULES: Array<{ pattern: RegExp; icon: string }> = [
  { pattern: /leaf|green|spinach|kale/i, icon: 'grass' },
  { pattern: /root|carrot|potato|beet|onion/i, icon: 'nutrition' },
  { pattern: /cut|kit|mix|prep/i, icon: 'kitchen' },
  { pattern: /organic|special|season/i, icon: 'stars' },
  { pattern: /vegetable|veg/i, icon: 'eco' },
]

const CATEGORY_TONES = [
  { bg: 'bg-primary/10', text: 'text-primary' },
  { bg: 'bg-secondary/10', text: 'text-secondary' },
  { bg: 'bg-tertiary-container/10', text: 'text-tertiary' },
  { bg: 'bg-surface-variant', text: 'text-on-surface-variant' },
] as const

export function getCategoryIcon(category: Pick<AdminCategory, 'name' | 'slug'>) {
  const haystack = `${category.slug ?? ''} ${category.name ?? ''}`
  for (const rule of CATEGORY_ICON_RULES) {
    if (rule.pattern.test(haystack)) return rule.icon
  }
  return 'category'
}

export function getCategoryTone(index: number) {
  return CATEGORY_TONES[index % CATEGORY_TONES.length]!
}

export function countProductsByCategory(products: BuyerProduct[]) {
  const counts = new Map<string, number>()
  for (const product of products) {
    const categoryUuid =
      typeof product.category === 'object' && product.category !== null
        ? String((product.category as { uuid?: string }).uuid ?? '')
        : ''
    if (!categoryUuid) continue
    counts.set(categoryUuid, (counts.get(categoryUuid) ?? 0) + 1)
  }
  return counts
}

export type ProductTagVisual = {
  icon: string
  chipClass: string
  iconWrapClass: string
}

const TAG_VISUALS: Record<string, ProductTagVisual> = {
  organic: {
    icon: 'eco',
    chipClass: 'bg-primary text-on-primary',
    iconWrapClass: 'bg-primary-container/20 text-primary',
  },
  locally_sourced: {
    icon: 'agriculture',
    chipClass: 'bg-secondary text-on-secondary',
    iconWrapClass: 'bg-secondary-container/20 text-secondary',
  },
  pre_cut: {
    icon: 'timer',
    chipClass: 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20',
    iconWrapClass: 'bg-secondary-container/20 text-secondary',
  },
  bundles: {
    icon: 'inventory_2',
    chipClass: 'bg-tertiary-container text-on-tertiary-container',
    iconWrapClass: 'bg-tertiary-container/20 text-tertiary',
  },
}

export function getProductTagVisual(value: string, index = 0): ProductTagVisual {
  if (TAG_VISUALS[value]) return TAG_VISUALS[value]!
  const fallbackTones = [
    {
      icon: 'sell',
      chipClass: 'border border-outline text-outline',
      iconWrapClass: 'bg-outline-variant/20 text-on-surface',
    },
    {
      icon: 'label',
      chipClass: 'bg-primary-fixed text-on-primary-fixed',
      iconWrapClass: 'bg-primary/10 text-primary',
    },
  ]
  return fallbackTones[index % fallbackTones.length]!
}

export function countProductsByTag(products: BuyerProduct[]) {
  const counts = new Map<string, number>()
  for (const product of products) {
    for (const tag of getProductTags(product)) {
      counts.set(tag.value, (counts.get(tag.value) ?? 0) + 1)
    }
  }
  return counts
}
