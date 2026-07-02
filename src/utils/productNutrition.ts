export type ProductNutrition = {
  calories?: number | null
  protein_g?: number | null
  fat_g?: number | null
  carbohydrates_g?: number | null
  fiber_g?: number | null
  sugar_g?: number | null
  vitamins?: string | null
  iron_mg?: number | null
}

export type NutritionStat = {
  value: string
  label: string
}

function formatNumber(value: number, maxDecimals = 1): string {
  const rounded = Math.round(value * 10 ** maxDecimals) / 10 ** maxDecimals
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

const MACRONUTRIENT_FIELDS: Array<{
  key: keyof ProductNutrition
  label: string
  unit?: 'g' | 'mg'
  decimals?: number
}> = [
  { key: 'calories', label: 'Calories', decimals: 0 },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
  { key: 'fat_g', label: 'Fat', unit: 'g' },
  { key: 'carbohydrates_g', label: 'Carbohydrates', unit: 'g' },
  { key: 'fiber_g', label: 'Fiber', unit: 'g' },
  { key: 'sugar_g', label: 'Sugar', unit: 'g' },
]

/** Nutrition is stored per 100g; buyer UI displays per kg. */
export const NUTRITION_SELLER_BASIS = '100g'
export const NUTRITION_BUYER_BASIS = 'kg'
export const BUYER_NUTRITION_SCALE = 10

/** Heading for buyer nutrition panel. */
export function formatBuyerNutritionHeading(quantity: number): string {
  const qty = Math.max(1, quantity)

  if (qty <= 1) {
    return `Nutrition (per ${NUTRITION_BUYER_BASIS})`
  }

  return `Nutrition (${qty} ${NUTRITION_BUYER_BASIS})`
}

/** Nutrition values are stored per 100g; scale for display and cart quantity. */
export function buildNutritionStats(
  nutrition: ProductNutrition | null | undefined,
  quantity: number,
  basisScale = 1,
): NutritionStat[] {
  if (!nutrition) return []

  const qty = Math.max(1, quantity)
  const multiplier = basisScale * qty
  const stats: NutritionStat[] = []

  for (const field of MACRONUTRIENT_FIELDS) {
    const raw = nutrition[field.key]
    if (raw == null || typeof raw !== 'number') continue

    const scaled = raw * multiplier
    if (field.key === 'calories') {
      stats.push({ value: formatNumber(scaled, field.decimals ?? 0), label: field.label })
    } else {
      stats.push({ value: `${formatNumber(scaled, field.decimals ?? 1)}${field.unit ?? 'g'}`, label: field.label })
    }
  }

  if (nutrition.vitamins?.trim()) {
    stats.push({ value: nutrition.vitamins.trim(), label: 'Vitamins' })
  }
  if (nutrition.iron_mg != null) {
    stats.push({ value: `${formatNumber(nutrition.iron_mg * multiplier)}mg`, label: 'Iron' })
  }

  return stats
}

export function buildBuyerNutritionStats(
  nutrition: ProductNutrition | null | undefined,
  quantity: number,
): NutritionStat[] {
  return buildNutritionStats(nutrition, quantity, BUYER_NUTRITION_SCALE)
}

export function buildNutritionPayload(fields: {
  calories: string
  protein_g: string
  fat_g: string
  carbohydrates_g: string
  fiber_g: string
  sugar_g: string
  vitamins: string
  iron_mg: string
}): ProductNutrition | null {
  const entries: ProductNutrition = {
    calories: fields.calories.trim() ? Number(fields.calories) : null,
    protein_g: fields.protein_g.trim() ? Number(fields.protein_g) : null,
    fat_g: fields.fat_g.trim() ? Number(fields.fat_g) : null,
    carbohydrates_g: fields.carbohydrates_g.trim() ? Number(fields.carbohydrates_g) : null,
    fiber_g: fields.fiber_g.trim() ? Number(fields.fiber_g) : null,
    sugar_g: fields.sugar_g.trim() ? Number(fields.sugar_g) : null,
    vitamins: fields.vitamins.trim() || null,
    iron_mg: fields.iron_mg.trim() ? Number(fields.iron_mg) : null,
  }

  const hasValue = Object.values(entries).some((value) => value != null && value !== '')
  if (!hasValue) return null

  return entries
}

export function nutritionFromProduct(product?: { nutrition?: ProductNutrition | null } | null): ProductNutrition | null {
  const nutrition = product?.nutrition
  if (!nutrition || typeof nutrition !== 'object') return null
  return nutrition
}

export function applyNutritionToFormFields(nutrition: ProductNutrition) {
  return {
    nutrition_calories: nutrition.calories != null ? String(nutrition.calories) : '',
    nutrition_protein_g: nutrition.protein_g != null ? String(nutrition.protein_g) : '',
    nutrition_fat_g: nutrition.fat_g != null ? String(nutrition.fat_g) : '',
    nutrition_carbohydrates_g: nutrition.carbohydrates_g != null ? String(nutrition.carbohydrates_g) : '',
    nutrition_fiber_g: nutrition.fiber_g != null ? String(nutrition.fiber_g) : '',
    nutrition_sugar_g: nutrition.sugar_g != null ? String(nutrition.sugar_g) : '',
    nutrition_vitamins: nutrition.vitamins ?? '',
    nutrition_iron_mg: nutrition.iron_mg != null ? String(nutrition.iron_mg) : '',
  }
}
