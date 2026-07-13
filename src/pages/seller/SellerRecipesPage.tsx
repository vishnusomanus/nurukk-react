import { useMemo, useState } from 'react'
import { Link, useLocation, useOutletContext } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sellerRecipesService from '@/api/services/sellerRecipesService'
import type { SellerRecipe } from '@/api/services/sellerRecipesService'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { Pagination } from '@/components/ui/Pagination'
import type { SellerOutletContext } from '@/layouts/SellerMarketplaceLayout'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { extractRows } from '@/utils/extractRows'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const softCard =
  'rounded-2xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none'

type StatusFilter = 'all' | 'published' | 'draft'

function formatCompact(n?: number | null) {
  if (n == null || Number.isNaN(n)) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`
  return String(Math.round(n))
}

function RecipeRow({
  recipe,
  onDuplicate,
  onDelete,
  busy,
}: {
  recipe: SellerRecipe
  onDuplicate: () => void
  onDelete: () => void
  busy: boolean
}) {
  const cover = sellerRecipesService.recipeCoverUrl(recipe)
  const published = sellerRecipesService.isRecipePublished(recipe)

  return (
    <article className={cn(softCard, 'overflow-hidden')}>
      <div className="flex gap-3 p-3">
        <Link
          to={`/seller/recipes/${recipe.uuid}/edit`}
          className="flex min-w-0 flex-1 gap-3 active:opacity-90"
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container">
            {cover ? (
              <RemoteImage src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-[15px] font-bold text-on-surface">
                {sellerRecipesService.recipeTitle(recipe)}
              </h3>
              <span className="material-symbols-outlined shrink-0 text-[20px] text-outline">
                chevron_right
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                  published
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-container-high text-on-surface-variant',
                )}
              >
                {sellerRecipesService.formatRecipeStatus(recipe)}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {recipe.avg_rating != null ? `★ ${recipe.avg_rating.toFixed(1)}` : 'No rating'}
                {recipe.rating_count ? ` · ${formatCompact(recipe.rating_count)} reviews` : ''}
              </span>
            </div>
          </div>
        </Link>
      </div>
      <div className="flex border-t border-outline-variant/30">
        <button
          type="button"
          disabled={busy}
          onClick={onDuplicate}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-on-surface-variant transition-colors active:bg-surface-container-low disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">content_copy</span>
          Duplicate
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-1.5 border-l border-outline-variant/30 py-2.5 text-xs font-bold text-error transition-colors active:bg-error/5 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Delete
        </button>
      </div>
    </article>
  )
}

function RecipeCard({
  recipe,
  onDuplicate,
  onDelete,
  busy,
}: {
  recipe: SellerRecipe
  onDuplicate: () => void
  onDelete: () => void
  busy: boolean
}) {
  const cover = sellerRecipesService.recipeCoverUrl(recipe)
  const published = sellerRecipesService.isRecipePublished(recipe)
  const badge = recipe.badge?.trim()

  return (
    <article className={cn(softCard, 'overflow-hidden')}>
      <Link to={`/seller/recipes/${recipe.uuid}/edit`} className="block">
        <div className="relative aspect-[4/3] bg-surface-container">
          {cover ? (
            <RemoteImage src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-outline">
              <span className="material-symbols-outlined text-4xl">restaurant_menu</span>
            </div>
          )}
          <span
            className={cn(
              'absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase',
              published ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant',
            )}
          >
            {sellerRecipesService.formatRecipeStatus(recipe)}
          </span>
          <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </span>
        </div>
        <div className="space-y-3 p-4">
          <h3 className="truncate text-base font-bold text-on-surface">
            {sellerRecipesService.recipeTitle(recipe)}
          </h3>
          <div className="flex gap-4 text-xs text-on-surface-variant">
            <div>
              <p className="font-semibold text-on-surface-variant/80">Rating</p>
              <p className="mt-0.5 text-sm font-bold text-on-surface">
                {recipe.avg_rating != null ? recipe.avg_rating.toFixed(1) : '—'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-on-surface-variant/80">Reviews</p>
              <p className="mt-0.5 text-sm font-bold text-on-surface">
                {formatCompact(recipe.rating_count ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between border-t border-outline-variant/40 px-3 py-2.5">
        <div className="flex gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={onDuplicate}
            className="flex size-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
            aria-label="Duplicate recipe"
          >
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="flex size-9 items-center justify-center rounded-full text-error transition-colors hover:bg-error/10 disabled:opacity-50"
            aria-label="Delete recipe"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
        {badge ? (
          <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-bold text-on-surface-variant">
            {badge}
          </span>
        ) : null}
      </div>
    </article>
  )
}

export function SellerRecipesPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { search } = useOutletContext<SellerOutletContext>()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'recipes', page, search],
    queryFn: () =>
      sellerRecipesService.listRecipes({
        page,
        per_page: 12,
        search: search.trim() || undefined,
      }),
  })

  const rows = extractRows(data?.data) as SellerRecipe[]
  const meta = extractPaginationMeta(data)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((recipe) => {
      const published = sellerRecipesService.isRecipePublished(recipe)
      if (filter === 'published' && !published) return false
      if (filter === 'draft' && published) return false
      if (!q) return true
      const title = sellerRecipesService.recipeTitle(recipe).toLowerCase()
      return (
        title.includes(q) ||
        String(recipe.description ?? '')
          .toLowerCase()
          .includes(q)
      )
    })
  }, [filter, rows, search])

  const duplicateMutation = useMutation({
    mutationFn: (uuid: string) => sellerRecipesService.duplicateRecipe(uuid),
    onSuccess: () => {
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: ['seller', 'recipes'] })
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Could not duplicate recipe')),
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => sellerRecipesService.deleteRecipe(uuid),
    onSuccess: () => {
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: ['seller', 'recipes'] })
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Could not delete recipe')),
  })

  const busyUuid =
    (duplicateMutation.isPending && duplicateMutation.variables) ||
    (deleteMutation.isPending && deleteMutation.variables) ||
    null

  const publishedCount = rows.filter((recipe) => sellerRecipesService.isRecipePublished(recipe)).length
  const draftCount = rows.length - publishedCount
  const totalCount = meta?.total ?? rows.length

  const confirmDelete = (recipe: SellerRecipe) => {
    if (window.confirm(`Delete “${sellerRecipesService.recipeTitle(recipe)}”?`)) {
      deleteMutation.mutate(recipe.uuid)
    }
  }

  return (
    <SellerPageShell pathname={location.pathname} className="space-y-3 lg:space-y-6">
      {/* Desktop header — create CTA lives in SellerTopHeader */}
      <div className="hidden lg:block">
        <h2 className="text-headline-xl text-primary">Recipe Management</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Create and curate your farm-to-table digital offerings.
        </p>
      </div>

      {/* Mobile/tablet compact stats */}
      <div className="grid grid-cols-3 gap-2 lg:hidden">
        <div className={cn(softCard, 'px-3 py-3')}>
          <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Total</p>
          <p className="mt-0.5 text-xl font-bold text-on-surface">{totalCount}</p>
        </div>
        <div className={cn(softCard, 'px-3 py-3')}>
          <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Live</p>
          <p className="mt-0.5 text-xl font-bold text-primary">{publishedCount}</p>
        </div>
        <div className={cn(softCard, 'px-3 py-3')}>
          <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Draft</p>
          <p className="mt-0.5 text-xl font-bold text-on-surface">{draftCount}</p>
        </div>
      </div>

      {/* Desktop stats */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        {(
          [
            {
              label: 'Total Recipes',
              icon: 'menu_book',
              iconClass: 'bg-primary/10 text-primary',
              value: String(totalCount),
            },
            {
              label: 'Published',
              icon: 'visibility',
              iconClass: 'bg-primary/10 text-primary',
              value: String(publishedCount),
            },
            {
              label: 'Drafts',
              icon: 'edit_note',
              iconClass: 'bg-secondary/10 text-secondary',
              value: String(draftCount),
            },
          ] as const
        ).map((card) => (
          <div key={card.label} className={cn(softCard, 'p-5')}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-on-surface-variant">{card.label}</p>
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-full',
                  card.iconClass,
                )}
              >
                <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-on-surface">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 rounded-full bg-surface-container-lowest p-1 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:max-w-md lg:rounded-xl lg:border lg:border-outline-variant/30 lg:bg-surface-container-lowest lg:shadow-none">
        {(
          [
            { id: 'all' as const, label: 'All' },
            { id: 'published' as const, label: 'Published' },
            { id: 'draft' as const, label: 'Draft' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              'flex-1 rounded-full px-3 py-2.5 text-xs font-bold transition-colors sm:text-sm lg:rounded-lg',
              filter === tab.id
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant active:bg-surface-container-low lg:hover:bg-surface-container-low',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Link
        to="/seller/recipes/new"
        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-on-primary lg:hidden"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        Create recipe
      </Link>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(error, 'Failed to load recipes')}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <>
          <div className="space-y-3 lg:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
          <div className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        </>
      ) : filtered.length === 0 ? (
        <div className={cn(softCard, 'py-14 text-center')}>
          <span className="material-symbols-outlined mb-3 text-5xl text-outline">menu_book</span>
          <p className="text-sm text-on-surface-variant">
            {filter === 'all' ? 'No recipes yet.' : `No ${filter} recipes.`}
          </p>
          <Link
            to="/seller/recipes/new"
            className="mt-4 inline-block text-sm font-bold text-primary hover:underline"
          >
            Create your first recipe
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile / tablet list */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((recipe) => (
              <RecipeRow
                key={recipe.uuid}
                recipe={recipe}
                busy={busyUuid === recipe.uuid}
                onDuplicate={() => duplicateMutation.mutate(recipe.uuid)}
                onDelete={() => confirmDelete(recipe)}
              />
            ))}
          </div>

          {/* Desktop card grid */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-4">
            {filtered.map((recipe) => (
              <RecipeCard
                key={recipe.uuid}
                recipe={recipe}
                busy={busyUuid === recipe.uuid}
                onDuplicate={() => duplicateMutation.mutate(recipe.uuid)}
                onDelete={() => confirmDelete(recipe)}
              />
            ))}
          </div>
        </>
      )}

      {meta && meta.last_page > 1 ? <Pagination meta={meta} onPageChange={setPage} /> : null}

      <div className="hidden flex-col items-start gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low/60 p-5 lg:flex lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-primary">
            <span className="material-symbols-outlined">restaurant_menu</span>
          </span>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Want to increase visibility?</h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Join Seasonal Harvest promotions to feature your recipes.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
          Learn more about promotions
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </span>
      </div>
    </SellerPageShell>
  )
}
