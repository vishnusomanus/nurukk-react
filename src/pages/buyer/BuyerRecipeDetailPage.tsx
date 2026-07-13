import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as buyerRecipesService from '@/api/services/buyerRecipesService'
import type { BuyerRecipeRating } from '@/api/services/buyerRecipesService'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { RecipeRateForm } from '@/components/buyer/RecipeRateForm'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { useAddToCart } from '@/hooks/useAddToCart'
import { useAuthStore } from '@/store/authStore'
import { extractRows } from '@/utils/extractRows'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

function RatingStars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={cn(
            'material-symbols-outlined text-secondary',
            star > value && 'text-outline-variant',
          )}
          style={{
            fontSize: size,
            fontVariationSettings: star <= value ? "'FILL' 1" : undefined,
          }}
        >
          star
        </span>
      ))}
    </span>
  )
}

function formatRatingDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function BuyerRecipeDetailPage() {
  const { recipeUuid = '' } = useParams()
  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const user = useAuthStore((s) => s.user)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [addingBundle, setAddingBundle] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'recipe', recipeUuid],
    queryFn: () => buyerRecipesService.getRecipe(recipeUuid),
    enabled: !!recipeUuid,
  })

  const {
    data: ratingsData,
    isLoading: ratingsLoading,
    error: ratingsError,
  } = useQuery({
    queryKey: ['buyer', 'recipe', recipeUuid, 'ratings'],
    queryFn: () => buyerRecipesService.listRatings(recipeUuid, { page: 1, per_page: 20 }),
    enabled: !!recipeUuid,
  })

  const recipe = data?.data
  const ratings = extractRows(ratingsData?.data) as BuyerRecipeRating[]
  const myRating = useMemo(() => {
    const userUuid = user?.uuid
    if (!userUuid) return null
    return ratings.find((row) => row.user?.uuid === userUuid) ?? null
  }, [ratings, user?.uuid])

  const steps = useMemo(() => buyerRecipesService.resolveRecipeSteps(recipe), [recipe])
  const bundle = useMemo(
    () => (recipe ? buyerRecipesService.recipeBundleTotals(recipe) : null),
    [recipe],
  )

  const totalMinutes = recipe ? buyerRecipesService.recipeTotalMinutes(recipe) : 0

  const onBuyBundle = async () => {
    if (!recipe || !bundle || bundle.items.length === 0) return
    setBundleError(null)
    setAddingBundle(true)
    try {
      for (const item of bundle.items) {
        await addToCart.mutateAsync({
          product_uuid: item.product.uuid,
          quantity: 1,
        })
      }
      navigate('/buyer/checkout')
    } catch (err) {
      setBundleError(getApiErrorMessage(err, 'Could not add bundle to cart'))
    } finally {
      setAddingBundle(false)
    }
  }

  return (
    <div className="app-page-pad-bottom lg:pb-8">
      <BuyerPageHeader title="Recipe" backTo="/buyer/recipes" />

      {isLoading ? (
        <main className="app-page-pad-top buyer-page-container">
          <div className="h-64 animate-pulse rounded-2xl bg-surface-container lg:h-80" />
        </main>
      ) : error || !recipe ? (
        <main className="app-page-pad-top buyer-page-container">
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {getApiErrorMessage(error, 'Recipe not found')}
          </p>
        </main>
      ) : (
        <main className="app-page-pad-top space-y-0 lg:pt-8">
          {/* Hero */}
          <section className="relative lg:buyer-page-container lg:mb-0">
            <div className="relative aspect-[5/4] overflow-hidden bg-surface-container sm:aspect-[16/9] lg:rounded-3xl">
              {recipe.image_url ? (
                <RemoteImage
                  src={recipe.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-6xl">restaurant_menu</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 pb-10 sm:p-6 sm:pb-12">
                <span className="inline-flex rounded-full bg-tertiary px-2.5 py-1 text-[10px] font-bold tracking-wide text-on-tertiary uppercase">
                  Farm Fresh Recipe
                </span>
                <h1 className="text-2xl font-bold text-white sm:text-headline-xl">{recipe.title}</h1>
              </div>
            </div>
          </section>

          <div className="buyer-page-container relative z-10 space-y-5 lg:max-w-4xl lg:space-y-6">
            {/* Meta row — always above the bundle so prep/servings stay visible */}
            <div className="-mt-7 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-3 shadow-[0_4px_16px_rgba(15,40,20,0.08)] sm:px-4 lg:mt-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-on-surface">
                {recipe.prep_time_minutes != null && recipe.prep_time_minutes > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-primary">timer</span>
                    {recipe.prep_time_minutes} min prep
                  </span>
                ) : null}
                {recipe.cook_time_minutes != null && recipe.cook_time_minutes > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-primary">oven_gen</span>
                    {recipe.cook_time_minutes} min cook
                  </span>
                ) : null}
                {totalMinutes > 0 &&
                !(recipe.prep_time_minutes || recipe.cook_time_minutes) ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                    {totalMinutes} min
                  </span>
                ) : null}
                {recipe.servings ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      restaurant
                    </span>
                    {recipe.servings} servings
                  </span>
                ) : null}
                {recipe.avg_rating != null ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-primary">star</span>
                    {recipe.avg_rating.toFixed(1)}
                    {recipe.rating_count ? (
                      <span className="font-normal text-on-surface-variant">
                        ({recipe.rating_count})
                      </span>
                    ) : null}
                  </span>
                ) : null}
                {!recipe.prep_time_minutes &&
                !recipe.cook_time_minutes &&
                !recipe.servings &&
                recipe.avg_rating == null ? (
                  <span className="text-sm text-on-surface-variant">Recipe details</span>
                ) : null}
              </div>
            </div>

            {/* Smart Bundle */}
            {bundle && bundle.items.length > 0 ? (
              <section className="rounded-xl border border-surface-variant/30 bg-surface-container-lowest p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">Smart Bundle</h2>
                    <p className="text-sm text-on-surface-variant">
                      All fresh ingredients for this recipe
                    </p>
                  </div>
                  {bundle.items.length >= 2 ? (
                    <span className="shrink-0 rounded-lg bg-secondary-container px-2.5 py-1 text-[10px] font-bold tracking-wide text-on-secondary-container uppercase">
                      Ready Bundle
                    </span>
                  ) : null}
                </div>

                <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
                  {bundle.items.map((item) => {
                    const price = buyerRecipesService.productUnitPrice(item.product)
                    const thumb = item.product.image_url ?? item.product.images?.[0]
                    return (
                      <Link
                        key={item.product.uuid}
                        to={`/buyer/products/${item.product.uuid}`}
                        className="flex items-center gap-3 rounded-lg bg-surface-container-low p-2.5 transition-colors active:bg-surface-container lg:hover:bg-surface-container"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                          {thumb ? (
                            <RemoteImage src={thumb} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-outline">
                              <span className="material-symbols-outlined text-[18px]">grocery</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-on-surface">{item.name}</p>
                          <p className="text-xs text-on-surface-variant">
                            {[item.quantity, item.unit].filter(Boolean).join(' ')}
                            {price > 0 ? ` · ${formatCurrency(price)}` : ''}
                          </p>
                        </div>
                        <span
                          className="material-symbols-outlined text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      </Link>
                    )
                  })}
                </div>

                {bundleError ? (
                  <p className="mb-3 text-sm text-error">{bundleError}</p>
                ) : null}

                <button
                  type="button"
                  disabled={addingBundle || addToCart.isPending}
                  onClick={() => void onBuyBundle()}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary text-sm font-bold text-on-primary shadow-[0px_8px_24px_rgba(46,125,50,0.12)] transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  <span>{addingBundle ? 'Adding…' : 'Buy Recipe Bundle'}</span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm">
                    {formatCurrency(bundle.total)}
                  </span>
                  <span className="material-symbols-outlined text-[22px]">shopping_cart_checkout</span>
                </button>

                {bundle.items.length > 1 ? (
                  <p className="mt-2 text-center text-[11px] text-on-surface-variant">
                    {bundle.items.length} ingredients · {formatCurrency(bundle.total)} total
                  </p>
                ) : null}
              </section>
            ) : (
              <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low/60 p-5 text-center">
                <p className="text-sm text-on-surface-variant">
                  Ingredient products are not linked for this recipe yet.
                </p>
              </section>
            )}

            {recipe.description ? (
              <p className="text-sm leading-relaxed text-on-surface-variant lg:text-body-md">
                {recipe.description}
              </p>
            ) : null}

            {recipe.seller?.store_name || recipe.seller?.name ? (
              <Link
                to={recipe.seller.uuid ? `/buyer/stores/${recipe.seller.uuid}` : '/buyer'}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                {recipe.seller.store_name ?? recipe.seller.name}
              </Link>
            ) : null}

            {/* Instructions */}
            {steps.length > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-primary" />
                  <h2 className="text-lg font-bold text-on-surface">Cooking Instructions</h2>
                </div>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex gap-4 border-b border-surface-variant/30 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1 pt-1">
                        {step.heading ? (
                          <h3 className="text-base font-bold text-on-surface">{step.heading}</h3>
                        ) : null}
                        {step.content ? (
                          <p className="text-sm leading-relaxed whitespace-pre-line text-on-surface-variant">
                            {step.content}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Ratings */}
            <section className="space-y-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-primary" />
                  <h2 className="text-lg font-bold text-on-surface">Ratings & reviews</h2>
                </div>
                {recipe.avg_rating != null ? (
                  <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                    <RatingStars value={Math.round(recipe.avg_rating)} size={16} />
                    <span>{recipe.avg_rating.toFixed(1)}</span>
                    {recipe.rating_count ? (
                      <span className="font-normal text-on-surface-variant">
                        · {recipe.rating_count}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <RecipeRateForm
                recipeUuid={recipe.uuid}
                canRate={Boolean(recipe.can_rate)}
                initialRating={myRating?.rating}
                initialComment={myRating?.comment}
              />

              {ratingsError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                  {getApiErrorMessage(ratingsError, 'Failed to load reviews')}
                </p>
              ) : null}

              {ratingsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container" />
                  ))}
                </div>
              ) : ratings.length === 0 ? (
                <p className="rounded-xl bg-surface-container-low px-4 py-5 text-center text-sm text-on-surface-variant">
                  No reviews yet. Be the first to rate this recipe.
                </p>
              ) : (
                <div className="space-y-3">
                  {ratings.map((row) => {
                    const isMine = Boolean(user?.uuid && row.user?.uuid === user.uuid)
                    return (
                      <article
                        key={row.uuid}
                        className="rounded-xl bg-surface-container-low px-3.5 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-on-surface">
                              {row.user?.name?.trim() || 'Buyer'}
                              {isMine ? (
                                <span className="ml-2 text-[11px] font-semibold text-primary">
                                  You
                                </span>
                              ) : null}
                            </p>
                            <div className="mt-1">
                              <RatingStars value={row.rating} size={16} />
                            </div>
                          </div>
                          {row.created_at ? (
                            <span className="shrink-0 text-[11px] text-on-surface-variant">
                              {formatRatingDate(row.created_at)}
                            </span>
                          ) : null}
                        </div>
                        {row.comment?.trim() ? (
                          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                            {row.comment}
                          </p>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      )}
    </div>
  )
}
