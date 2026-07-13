import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import * as buyerRecipesService from '@/api/services/buyerRecipesService'
import type { BuyerRecipe, BuyerRecipeListParams } from '@/api/services/buyerRecipesService'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { RecipeCard } from '@/components/buyer/RecipeCard'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'
import { extractRows } from '@/utils/extractRows'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type PrepPreset = '' | '15' | '30' | '45'
type ServingsPreset = '' | '1-2' | '3-4' | '5+'
type IngredientsPreset = '' | '1-4' | '5-8' | '9+'

type RecipeFilters = {
  prepMax: PrepPreset
  servings: ServingsPreset
  ingredientsCount: IngredientsPreset
  ingredient: string
}

const EMPTY_FILTERS: RecipeFilters = {
  prepMax: '',
  servings: '',
  ingredientsCount: '',
  ingredient: '',
}

const PREP_OPTIONS: Array<{ id: PrepPreset; label: string }> = [
  { id: '', label: 'Any' },
  { id: '15', label: '≤ 15 min' },
  { id: '30', label: '≤ 30 min' },
  { id: '45', label: '≤ 45 min' },
]

const SERVINGS_OPTIONS: Array<{ id: ServingsPreset; label: string }> = [
  { id: '', label: 'Any' },
  { id: '1-2', label: '1–2' },
  { id: '3-4', label: '3–4' },
  { id: '5+', label: '5+' },
]

const INGREDIENT_COUNT_OPTIONS: Array<{ id: IngredientsPreset; label: string }> = [
  { id: '', label: 'Any' },
  { id: '1-4', label: '1–4' },
  { id: '5-8', label: '5–8' },
  { id: '9+', label: '9+' },
]

function filtersFromParams(params: URLSearchParams): RecipeFilters {
  const prep = params.get('prep_max')
  const servings = params.get('servings')
  const ingredientsCount = params.get('ing_count')
  return {
    prepMax: prep === '15' || prep === '30' || prep === '45' ? prep : '',
    servings:
      servings === '1-2' || servings === '3-4' || servings === '5+' ? servings : '',
    ingredientsCount:
      ingredientsCount === '1-4' || ingredientsCount === '5-8' || ingredientsCount === '9+'
        ? ingredientsCount
        : '',
    ingredient: params.get('ingredient')?.trim() ?? '',
  }
}

function filtersToApiParams(filters: RecipeFilters): Partial<BuyerRecipeListParams> {
  const params: Partial<BuyerRecipeListParams> = {}

  if (filters.prepMax) params.prep_time_max = Number(filters.prepMax)

  if (filters.servings === '1-2') {
    params.servings_min = 1
    params.servings_max = 2
  } else if (filters.servings === '3-4') {
    params.servings_min = 3
    params.servings_max = 4
  } else if (filters.servings === '5+') {
    params.servings_min = 5
  }

  if (filters.ingredientsCount === '1-4') {
    params.min_ingredients = 1
    params.max_ingredients = 4
  } else if (filters.ingredientsCount === '5-8') {
    params.min_ingredients = 5
    params.max_ingredients = 8
  } else if (filters.ingredientsCount === '9+') {
    params.min_ingredients = 9
  }

  if (filters.ingredient.trim()) params.ingredient = filters.ingredient.trim()

  return params
}

function countActiveFilters(filters: RecipeFilters) {
  return [
    filters.prepMax,
    filters.servings,
    filters.ingredientsCount,
    filters.ingredient.trim(),
  ].filter(Boolean).length
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ id: T; label: string }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id || 'any'}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'rounded-full px-3.5 py-2 text-xs font-bold transition-colors',
              value === option.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant active:bg-primary/10',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function IngredientSuggestField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [value])

  const { data, isFetching } = useQuery({
    queryKey: ['buyer', 'recipes', 'ingredient-suggestions', debounced],
    queryFn: () =>
      buyerRecipesService.suggestIngredients({
        q: debounced || undefined,
        limit: 10,
      }),
    enabled: open,
    staleTime: 30_000,
  })

  const suggestions = (data?.data ?? []).filter(
    (name) => name.toLowerCase() !== value.trim().toLowerCase(),
  )

  return (
    <div className="relative space-y-1.5">
      <span className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">
        Ingredient
      </span>
      <div className="relative">
        <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-on-surface-variant">
          grocery
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150)
          }}
          placeholder="e.g. spinach, tomato…"
          autoComplete="off"
          className="h-11 w-full rounded-xl border-none bg-surface-container-low py-2.5 pr-3 pl-10 text-[16px] text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary/20 lg:text-sm"
        />
        {isFetching ? (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-semibold text-on-surface-variant">
            …
          </span>
        ) : null}
      </div>

      {open && suggestions.length > 0 ? (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-1 shadow-[0_8px_24px_rgba(15,40,20,0.12)]">
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-on-surface active:bg-surface-container-low"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(name)
                  setOpen(false)
                }}
              >
                <span className="material-symbols-outlined text-[18px] text-primary">nutrition</span>
                <span className="truncate font-medium">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function RecipeFiltersPanel({
  draft,
  onChange,
  onApply,
  onClear,
}: {
  draft: RecipeFilters
  onChange: (next: RecipeFilters) => void
  onApply: () => void
  onClear: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-5 overflow-y-auto px-4 py-2 lg:px-0">
        <ChipGroup
          label="Prep time"
          options={PREP_OPTIONS}
          value={draft.prepMax}
          onChange={(prepMax) => onChange({ ...draft, prepMax })}
        />
        <ChipGroup
          label="Servings"
          options={SERVINGS_OPTIONS}
          value={draft.servings}
          onChange={(servings) => onChange({ ...draft, servings })}
        />
        <ChipGroup
          label="Ingredients count"
          options={INGREDIENT_COUNT_OPTIONS}
          value={draft.ingredientsCount}
          onChange={(ingredientsCount) => onChange({ ...draft, ingredientsCount })}
        />

        <IngredientSuggestField
          value={draft.ingredient}
          onChange={(ingredient) => onChange({ ...draft, ingredient })}
        />
      </div>

      <div className="mt-auto flex gap-2 border-t border-outline-variant/30 px-4 pt-3 pb-4 lg:px-0 lg:pb-0">
        <button
          type="button"
          onClick={onClear}
          className="h-11 flex-1 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onApply}
          className="h-11 flex-[1.3] rounded-xl bg-primary text-sm font-bold text-on-primary"
        >
          Show results
        </button>
      </div>
    </div>
  )
}

export function BuyerRecipesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const appliedFilters = useMemo(() => filtersFromParams(searchParams), [searchParams])
  const [draftFilters, setDraftFilters] = useState<RecipeFilters>(appliedFilters)

  useEffect(() => {
    if (filtersOpen) setDraftFilters(appliedFilters)
  }, [filtersOpen, appliedFilters])

  const closeFilters = useCallback(() => setFiltersOpen(false), [])
  const { handleProps, sheetStyle } = useSwipeToClose(closeFilters, { enabled: filtersOpen })

  const apiFilters = useMemo(() => filtersToApiParams(appliedFilters), [appliedFilters])
  const activeFilterCount = countActiveFilters(appliedFilters)

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'recipes', search, apiFilters],
    queryFn: () =>
      buyerRecipesService.listRecipes({
        page: 1,
        per_page: 24,
        search: search.trim() || undefined,
        ...apiFilters,
      }),
  })

  const rows = extractRows(data?.data) as BuyerRecipe[]

  const syncParams = (nextSearch: string, nextFilters: RecipeFilters) => {
    const params = new URLSearchParams()
    const q = nextSearch.trim()
    if (q) params.set('q', q)
    if (nextFilters.prepMax) params.set('prep_max', nextFilters.prepMax)
    if (nextFilters.servings) params.set('servings', nextFilters.servings)
    if (nextFilters.ingredientsCount) params.set('ing_count', nextFilters.ingredientsCount)
    if (nextFilters.ingredient.trim()) params.set('ingredient', nextFilters.ingredient.trim())
    setSearchParams(params, { replace: true })
  }

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    syncParams(search, appliedFilters)
  }

  const applyDraftFilters = () => {
    syncParams(search, draftFilters)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS)
    syncParams(search, EMPTY_FILTERS)
    setFiltersOpen(false)
  }

  return (
    <div className="app-page-pad-bottom lg:pb-8">
      <BuyerPageHeader
        title="Recipes"
        backTo="/buyer"
        right={
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="relative flex h-10 items-center gap-1 rounded-full px-2.5 text-primary active:bg-surface-container-low lg:hidden"
            aria-label="Open filters"
          >
            <span className="material-symbols-outlined text-[22px]">tune</span>
            {activeFilterCount > 0 ? (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        }
      />

      <main className="app-page-pad-top buyer-page-container space-y-5 lg:space-y-8 lg:pt-8">
        <div className="hidden items-end justify-between gap-4 lg:flex">
          <div>
            <h1 className="text-headline-xl text-primary">Recipes</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Farm-to-table dishes with ready ingredient bundles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-outline-variant px-4 text-sm font-bold text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-on-primary">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        <form onSubmit={onSearchSubmit}>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search seasonal recipes…"
              className="h-12 w-full rounded-full border-none bg-surface-container-low py-2.5 pr-4 pl-12 text-[16px] text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary/20 lg:text-sm"
            />
          </div>
        </form>

        {activeFilterCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {appliedFilters.prepMax ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                Prep ≤ {appliedFilters.prepMax} min
              </span>
            ) : null}
            {appliedFilters.servings ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                Serves {appliedFilters.servings}
              </span>
            ) : null}
            {appliedFilters.ingredientsCount ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                {appliedFilters.ingredientsCount} ingredients
              </span>
            ) : null}
            {appliedFilters.ingredient ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                {appliedFilters.ingredient}
              </span>
            ) : null}
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-bold text-on-surface-variant underline"
            >
              Clear all
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {getApiErrorMessage(error, 'Failed to load recipes')}
          </p>
        ) : null}

        {isLoading ? (
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest py-16 text-center shadow-[0_2px_12px_rgba(15,40,20,0.06)]">
            <span className="material-symbols-outlined mb-3 text-5xl text-outline">menu_book</span>
            <p className="text-sm text-on-surface-variant">No recipes match these filters.</p>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm font-bold text-primary"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 xl:grid-cols-3">
            {rows.map((recipe) => (
              <RecipeCard key={recipe.uuid} recipe={recipe} />
            ))}
          </div>
        )}

        <section className="rounded-xl border-2 border-dashed border-primary/20 bg-primary-container/10 p-5 text-center lg:p-8">
          <span className="material-symbols-outlined mb-2 text-4xl text-primary">outdoor_grill</span>
          <h2 className="text-headline-lg-mobile text-on-surface">Request a Recipe</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Have a specific ingredient you need inspiration for? Let our farm chefs help!
          </p>
          <Link
            to="/buyer/search"
            className="mt-4 inline-flex h-11 w-full max-w-sm items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary"
          >
            Get Personalized Idea
          </Link>
        </section>
      </main>

      {filtersOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center lg:p-6"
              role="presentation"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                aria-label="Close filters"
                onClick={closeFilters}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Recipe filters"
                className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-surface shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.35)] lg:rounded-[1.75rem] lg:shadow-2xl"
                style={sheetStyle}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="shrink-0 px-4 pt-1 lg:px-5 lg:pt-4">
                  <div className="lg:hidden">
                    <BottomSheetHandle {...handleProps} />
                  </div>
                  <div className="flex items-center justify-between gap-3 pb-2">
                    <h2 className="text-lg font-bold text-on-surface">Filters</h2>
                    <button
                      type="button"
                      onClick={closeFilters}
                      className="flex size-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant"
                      aria-label="Close"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
                <div className="min-h-0 flex-1">
                  <RecipeFiltersPanel
                    draft={draftFilters}
                    onChange={setDraftFilters}
                    onApply={applyDraftFilters}
                    onClear={clearFilters}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
