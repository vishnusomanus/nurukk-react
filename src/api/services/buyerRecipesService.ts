import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'
import { instructionsToRecipeSteps } from '@/utils/recipeSteps'

export type BuyerRecipeIngredientProduct = {
  uuid: string
  name?: string
  price?: number
  discount_price?: number | null
  unit?: string | null
  image_url?: string | null
  images?: string[]
  is_available?: boolean
}

export type BuyerRecipeIngredient = {
  name: string
  quantity?: string | null
  unit?: string | null
  sort_order?: number
  product?: BuyerRecipeIngredientProduct | null
}

export type BuyerRecipe = {
  uuid: string
  title: string
  slug?: string
  description?: string | null
  instructions?: string | null
  steps?: Array<{ heading: string; content: string }>
  image_url?: string | null
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  servings?: number | null
  is_published?: boolean
  avg_rating?: number | null
  rating_count?: number
  /** True when the authenticated buyer has purchased every linked ingredient (delivered). */
  can_rate?: boolean
  seller?: {
    uuid?: string
    store_name?: string
    name?: string
  } | null
  ingredients?: BuyerRecipeIngredient[]
  created_at?: string | null
  updated_at?: string | null
}

export type BuyerRecipeListParams = {
  page?: number
  per_page?: number
  search?: string
  seller_uuid?: string
  product_uuid?: string
  ingredient?: string
  prep_time_min?: number
  prep_time_max?: number
  cook_time_min?: number
  cook_time_max?: number
  total_time_max?: number
  servings_min?: number
  servings_max?: number
  min_ingredients?: number
  max_ingredients?: number
  has_bundle?: boolean
}

export async function listRecipes(params?: BuyerRecipeListParams) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<BuyerRecipe> | BuyerRecipe[]>>(
    '/v1/buyer/recipes',
    { params },
  )
  return data
}

export async function getRecipe(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<BuyerRecipe>>(`/v1/buyer/recipes/${uuid}`)
  return data
}

export async function suggestIngredients(params?: { q?: string; limit?: number }) {
  const { data } = await apiClient.get<GenericSuccess<string[]>>(
    '/v1/buyer/recipes/ingredient-suggestions',
    { params },
  )
  return data
}

export type BuyerRecipeRating = {
  uuid: string
  rating: number
  comment?: string | null
  user?: {
    uuid?: string
    name?: string
  } | null
  created_at?: string | null
}

export async function listRatings(uuid: string, params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<BuyerRecipeRating> | BuyerRecipeRating[]>>(
    `/v1/buyer/recipes/${uuid}/ratings`,
    { params },
  )
  return data
}

export async function rateRecipe(
  uuid: string,
  payload: { rating: number; comment?: string },
) {
  const { data } = await apiClient.post<GenericSuccess<BuyerRecipeRating>>(
    `/v1/buyer/recipes/${uuid}/rate`,
    payload,
  )
  return data
}

export function recipeTotalMinutes(recipe: BuyerRecipe) {
  return (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)
}

export function recipeDifficulty(recipe: BuyerRecipe) {
  const total = recipeTotalMinutes(recipe)
  if (total <= 0) return 'Easy'
  if (total <= 20) return 'Easy'
  if (total <= 40) return 'Intermediate'
  return 'Advanced'
}

export function recipeHasBundle(recipe: BuyerRecipe) {
  return (recipe.ingredients ?? []).some((item) => Boolean(item.product?.uuid))
}

export function recipeBundleProducts(recipe: BuyerRecipe) {
  const seen = new Set<string>()
  const items: Array<{
    product: BuyerRecipeIngredientProduct
    name: string
    quantity?: string | null
    unit?: string | null
  }> = []

  for (const ingredient of recipe.ingredients ?? []) {
    const product = ingredient.product
    if (!product?.uuid || seen.has(product.uuid)) continue
    seen.add(product.uuid)
    items.push({
      product,
      name: product.name ?? ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit ?? product.unit,
    })
  }
  return items
}

export function productUnitPrice(product: BuyerRecipeIngredientProduct) {
  const discounted = product.discount_price
  if (typeof discounted === 'number' && discounted >= 0) return discounted
  return product.price ?? 0
}

export function recipeBundleTotals(recipe: BuyerRecipe) {
  const items = recipeBundleProducts(recipe)
  const subtotal = items.reduce((sum, item) => sum + productUnitPrice(item.product), 0)
  const total = Math.max(0, Math.round(subtotal * 100) / 100)
  return { items, subtotal, total }
}

export function instructionsToSteps(instructions?: string | null): string[] {
  return instructionsToRecipeSteps(instructions).map((step) =>
    [step.heading, step.content].filter(Boolean).join('\n'),
  )
}

export function resolveRecipeSteps(recipe?: BuyerRecipe | null) {
  if (recipe?.steps && recipe.steps.length > 0) {
    return recipe.steps.map((step) => ({
      heading: String(step.heading ?? '').trim(),
      content: String(step.content ?? '').trim(),
    }))
  }
  return instructionsToRecipeSteps(recipe?.instructions).filter(
    (step) => step.heading || step.content,
  )
}
