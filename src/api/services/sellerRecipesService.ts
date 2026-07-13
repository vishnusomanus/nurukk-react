import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'
import {
  instructionsToRecipeSteps,
  recipeStepsHaveContent,
  recipeStepsToInstructions,
  type RecipeStep,
} from '@/utils/recipeSteps'

export type { RecipeStep }

export type SellerRecipeIngredientProduct = {
  uuid: string
  name?: string
  price?: number
  unit?: string | null
  image_url?: string | null
  images?: string[]
}

export type SellerRecipeIngredient = {
  name: string
  quantity?: string | null
  unit?: string | null
  sort_order?: number
  product?: SellerRecipeIngredientProduct | null
  product_uuid?: string | null
  product_name?: string | null
  product_image?: string | null
  unit_price?: number | null
  line_total?: number | null
}

export type SellerRecipe = {
  uuid: string
  title: string
  slug?: string
  description?: string | null
  instructions?: string | null
  steps?: RecipeStep[]
  image_url?: string | null
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  servings?: number | null
  is_published?: boolean
  avg_rating?: number | null
  rating_count?: number
  ingredients?: SellerRecipeIngredient[]
  created_at?: string | null
  updated_at?: string | null
  /** UI aliases / optional extras */
  name?: string
  cover_image?: string | null
  status?: string | null
  badge?: string | null
  sales_count?: number | null
  views_count?: number | null
  [key: string]: unknown
}

export type UpsertRecipePayload = {
  title: string
  description?: string | null
  instructions: string
  image_url?: string | null
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  servings?: number | null
  is_published?: boolean
  ingredients?: Array<{
    name: string
    product_uuid?: string | null
    quantity?: string | null
    unit?: string | null
  }>
}

export async function listRecipes(params?: { page?: number; per_page?: number; search?: string }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<SellerRecipe> | SellerRecipe[]>>(
    '/v1/seller/recipes',
    { params },
  )
  return data
}

export async function getRecipe(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<SellerRecipe>>(`/v1/seller/recipes/${uuid}`)
  return data
}

export async function createRecipe(payload: UpsertRecipePayload) {
  const { data } = await apiClient.post<GenericSuccess<SellerRecipe>>('/v1/seller/recipes', payload)
  return data
}

export async function updateRecipe(uuid: string, payload: Partial<UpsertRecipePayload>) {
  const { data } = await apiClient.put<GenericSuccess<SellerRecipe>>(
    `/v1/seller/recipes/${uuid}`,
    payload,
  )
  return data
}

export async function deleteRecipe(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess<null>>(`/v1/seller/recipes/${uuid}`)
  return data
}

export async function duplicateRecipe(uuid: string) {
  const { data } = await apiClient.post<GenericSuccess<SellerRecipe>>(
    `/v1/seller/recipes/${uuid}/duplicate`,
  )
  return data
}

export function recipeTitle(recipe: SellerRecipe) {
  return recipe.title || recipe.name || 'Untitled recipe'
}

export function recipeCoverUrl(recipe: SellerRecipe) {
  return recipe.image_url || recipe.cover_image || null
}

export function isRecipePublished(recipe: SellerRecipe) {
  if (typeof recipe.is_published === 'boolean') return recipe.is_published
  const status = String(recipe.status ?? '').toLowerCase()
  return status === 'published' || status === 'active'
}

export function formatRecipeStatus(recipe: SellerRecipe) {
  return isRecipePublished(recipe) ? 'Published' : 'Draft'
}

export function resolveSellerRecipeSteps(recipe?: SellerRecipe | null): RecipeStep[] {
  if (recipe?.steps && Array.isArray(recipe.steps) && recipe.steps.length > 0) {
    return recipe.steps.map((step) => ({
      heading: String(step.heading ?? '').trim(),
      content: String(step.content ?? '').trim(),
    }))
  }
  return instructionsToRecipeSteps(recipe?.instructions)
}

/** @deprecated Prefer resolveSellerRecipeSteps / instructionsToRecipeSteps */
export function instructionsToSteps(instructions?: string | null): string[] {
  return instructionsToRecipeSteps(instructions).map((step) =>
    [step.heading, step.content].filter(Boolean).join('\n'),
  )
}

export function stepsToInstructions(steps: string[] | RecipeStep[]): string {
  if (steps.length === 0) return ''
  if (typeof steps[0] === 'string') {
    return (steps as string[])
      .map((step) => step.trim())
      .filter(Boolean)
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n\n')
  }
  return recipeStepsToInstructions(steps as RecipeStep[])
}

export function buildRecipePayload(input: {
  title: string
  description: string
  imageUrl: string | null
  prepTime: string
  cookTime: string
  servings: string
  steps: string[] | RecipeStep[]
  ingredients: Array<{
    product_uuid: string
    product_name?: string | null
    unit?: string | null
    quantity: number
  }>
  publish: boolean
}): UpsertRecipePayload {
  const instructions = stepsToInstructions(input.steps)
  return {
    title: input.title.trim(),
    description: input.description.trim() || null,
    instructions: instructions || '1. Add recipe steps',
    image_url: input.imageUrl,
    prep_time_minutes: Number(input.prepTime) || null,
    cook_time_minutes: Number(input.cookTime) || null,
    servings: Math.max(1, Number(input.servings) || 1),
    is_published: input.publish,
    ingredients: input.ingredients.map((item) => ({
      name: item.product_name?.trim() || 'Ingredient',
      product_uuid: item.product_uuid,
      quantity: String(item.quantity),
      unit: item.unit ?? null,
    })),
  }
}

export function emptyRecipeStep(): RecipeStep {
  return { heading: '', content: '' }
}

export function recipeHasStepContent(steps: RecipeStep[]) {
  return recipeStepsHaveContent(steps)
}
