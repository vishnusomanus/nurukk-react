import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerProduct, MarketplaceSearchResponse } from '@/api/services/buyerService'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { DeliveryRangeBanner } from '@/components/buyer/DeliveryRangeBanner'
import { CategoryListingSidebar } from '@/components/buyer/CategoryListingSidebar'
import { ProductCard } from '@/components/buyer/ProductCard'
import { SellerCard } from '@/components/buyer/SellerCard'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getCategoryNavIcon } from '@/utils/categoryNav'
import { useDeliveryScopeParams } from '@/hooks/useDeliveryScopeParams'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'
import {
  filterProductsByDietary,
  sortProducts,
  type ProductSort,
} from '@/utils/productListing'
import { cn } from '@/utils/cn'

const PER_PAGE = 12
const PRICE_MAX = 500

function nextPageFromMeta(payload: unknown): number | undefined {
  const meta = extractPaginationMeta(payload)
  if (!meta || meta.current_page >= meta.last_page) return undefined
  return meta.current_page + 1
}

function nextSearchProductPage(response: MarketplaceSearchResponse): number | undefined {
  const productsMeta = response.meta?.products
  if (!productsMeta) return nextPageFromMeta(response)
  if (productsMeta.next > productsMeta.current_page) return productsMeta.next
  const lastPage = Math.max(1, Math.ceil(productsMeta.total / Math.max(1, productsMeta.per_page)))
  if (productsMeta.current_page >= lastPage) return undefined
  return productsMeta.current_page + 1
}

export function CategoryListingView({
  categoryUuid,
  searchQuery,
  onSearchQueryChange,
  title = 'Fresh Vegetables',
  backTo,
  emptyMessage = 'No products match your filters yet.',
}: {
  categoryUuid?: string | null
  searchQuery?: string
  /** When set with searchQuery, shows an editable search field. */
  onSearchQueryChange?: (query: string) => void
  title?: string
  backTo?: string | null
  emptyMessage?: string
}) {
  const trimmedSearch = searchQuery?.trim() ?? ''
  const isSearchMode = searchQuery !== undefined
  const deliveryScope = useDeliveryScopeParams()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const [maxPrice, setMaxPrice] = useState(PRICE_MAX)
  const [organicOnly, setOrganicOnly] = useState(false)
  const [locallySourcedOnly, setLocallySourcedOnly] = useState(false)
  const [sort, setSort] = useState<ProductSort>('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState(searchQuery ?? '')
  const closeFilters = useCallback(() => setFiltersOpen(false), [])
  const { handleProps: filterHandleProps, sheetStyle: filterSheetStyle } = useSwipeToClose(closeFilters, {
    enabled: filtersOpen,
  })

  useEffect(() => {
    setSearchDraft(searchQuery ?? '')
  }, [searchQuery])

  const { data: categoriesData } = useQuery({
    queryKey: ['buyer', 'categories'],
    queryFn: () => buyerService.listCategories(),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['buyer', 'product-tags'],
    queryFn: () => buyerService.listProductTags(),
  })

  const categories = categoriesData?.data ?? []
  const tagOptions = tagsData?.data ?? []
  const activeCategory = categoryUuid
    ? categories.find((category) => category.uuid === categoryUuid)
    : undefined
  const pageTitle =
    isSearchMode && trimmedSearch
      ? `Results for "${trimmedSearch}"`
      : activeCategory?.name ?? title

  const apiTag =
    organicOnly && !locallySourcedOnly
      ? (tagOptions.find((tag) => tag.value === 'organic')?.value ?? 'organic')
      : locallySourcedOnly && !organicOnly
        ? (tagOptions.find((tag) => tag.value === 'locally_sourced')?.value ?? 'locally_sourced')
        : undefined

  const searchQueryResult = useInfiniteQuery({
    queryKey: ['buyer', 'search', trimmedSearch, deliveryScope.latitude, deliveryScope.longitude],
    queryFn: ({ pageParam }) =>
      buyerService.searchProducts({
        q: trimmedSearch,
        page: pageParam,
        per_page: PER_PAGE,
        seller_per_page: 6,
        ...deliveryScope,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => nextSearchProductPage(lastPage),
    enabled: isSearchMode && trimmedSearch.length > 0,
  })

  const categoryQueryResult = useInfiniteQuery({
    queryKey: [
      'buyer',
      'category-products',
      categoryUuid,
      deliveryScope.latitude,
      deliveryScope.longitude,
    ],
    queryFn: ({ pageParam }) =>
      buyerService.listCategoryProducts(categoryUuid!, {
        page: pageParam,
        per_page: PER_PAGE,
        ...deliveryScope,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => nextPageFromMeta(lastPage),
    enabled: !isSearchMode && !!categoryUuid,
  })

  const browseQueryResult = useInfiniteQuery({
    queryKey: [
      'buyer',
      'category-listing',
      maxPrice,
      apiTag,
      deliveryScope.latitude,
      deliveryScope.longitude,
    ],
    queryFn: ({ pageParam }) =>
      buyerService.listProducts({
        page: pageParam,
        per_page: PER_PAGE,
        max_price: maxPrice < PRICE_MAX ? maxPrice : undefined,
        tag: apiTag,
        ...deliveryScope,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => nextPageFromMeta(lastPage),
    enabled: !isSearchMode && !categoryUuid,
  })

  const activeQuery = isSearchMode
    ? searchQueryResult
    : categoryUuid
      ? categoryQueryResult
      : browseQueryResult

  const { isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = activeQuery

  const sellers = isSearchMode ? (searchQueryResult.data?.pages[0]?.data?.sellers ?? []) : []
  const sellerTotal = isSearchMode
    ? (searchQueryResult.data?.pages[0]?.meta?.sellers?.total ?? sellers.length)
    : 0
  const sellersLoading = isSearchMode && searchQueryResult.isLoading

  const products = useMemo(() => {
    const rows: BuyerProduct[] = isSearchMode
      ? (searchQueryResult.data?.pages.flatMap((page) => page.data?.products ?? []) ?? [])
      : categoryUuid
        ? (categoryQueryResult.data?.pages.flatMap((page) => page.data ?? []) ?? [])
        : (browseQueryResult.data?.pages.flatMap((page) => page.data ?? []) ?? [])

    const dietaryFiltered = filterProductsByDietary(rows, {
      organic: organicOnly,
      locallySourced: locallySourcedOnly,
    })
    const priceFiltered =
      maxPrice < PRICE_MAX
        ? dietaryFiltered.filter((product) => {
            const price = Number(product.discount_price ?? product.price ?? 0)
            return price <= maxPrice
          })
        : dietaryFiltered
    return sortProducts(priceFiltered, sort)
  }, [
    isSearchMode,
    searchQueryResult.data?.pages,
    categoryUuid,
    categoryQueryResult.data?.pages,
    browseQueryResult.data?.pages,
    organicOnly,
    locallySourcedOnly,
    maxPrice,
    sort,
  ])

  const totalItems = useMemo(() => {
    if (isSearchMode) {
      return searchQueryResult.data?.pages[0]?.meta?.products?.total ?? products.length
    }
    const firstPage = categoryUuid
      ? categoryQueryResult.data?.pages[0]
      : browseQueryResult.data?.pages[0]
    return extractPaginationMeta(firstPage)?.total ?? products.length
  }, [
    isSearchMode,
    searchQueryResult.data?.pages,
    categoryUuid,
    categoryQueryResult.data?.pages,
    browseQueryResult.data?.pages,
    products.length,
  ])

  const activeFilterCount =
    (maxPrice < PRICE_MAX ? 1 : 0) +
    (organicOnly ? 1 : 0) +
    (locallySourcedOnly ? 1 : 0) +
    (sort !== 'featured' ? 1 : 0)

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '240px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, products.length])

  const resultsSubtitle = (() => {
    if (isLoading) return 'Loading fresh picks…'
    if (isSearchMode && !trimmedSearch) {
      return 'Type above to find fresh produce and local farms.'
    }
    if (isSearchMode && trimmedSearch) {
      const productPart = `${totalItems} product${totalItems === 1 ? '' : 's'}`
      const sellerPart =
        sellerTotal > 0 ? `, ${sellerTotal} farm store${sellerTotal === 1 ? '' : 's'}` : ''
      return `Showing ${productPart}${sellerPart} for "${trimmedSearch}"`
    }
    return `Showing ${totalItems} locally harvested item${totalItems === 1 ? '' : 's'}`
  })()

  const filterControls = (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-[11px] font-semibold tracking-wider text-primary uppercase">
          Sort by
        </h4>
        <div className="space-y-2">
          {(
            [
              { value: 'featured', label: 'Featured' },
              { value: 'price_asc', label: 'Price: Low to High' },
              { value: 'price_desc', label: 'Price: High to Low' },
              { value: 'newest', label: 'Newest Arrivals' },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                sort === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-outline-variant bg-surface',
              )}
            >
              <input
                type="radio"
                name="category-sort"
                value={option.value}
                checked={sort === option.value}
                onChange={() => setSort(option.value)}
                className="h-4 w-4 border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-sm text-on-surface">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-3 text-[11px] font-semibold tracking-wider text-primary uppercase">
          Price Range
        </h4>
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={10}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-container-high accent-primary"
        />
        <div className="mt-2 flex justify-between text-xs text-on-surface-variant">
          <span>₹0</span>
          <span>{maxPrice >= PRICE_MAX ? '₹500+' : `₹${maxPrice}`}</span>
        </div>
      </div>
      <div>
        <h4 className="mb-3 text-[11px] font-semibold tracking-wider text-primary uppercase">Dietary</h4>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={organicOnly}
              onChange={(e) => setOrganicOnly(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="text-sm text-on-surface-variant">Organic</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={locallySourcedOnly}
              onChange={(e) => setLocallySourcedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="text-sm text-on-surface-variant">Locally Sourced</span>
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app-page-pad-bottom lg:pb-8">
      <BuyerPageHeader
        title={pageTitle}
        backTo={backTo}
        showBack={backTo != null || isSearchMode}
        right={
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="relative flex h-10 items-center gap-1 rounded-full px-2.5 text-primary hover:bg-surface-container-low md:hidden"
            aria-label="Open filters and sort"
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

      <div className="app-page-pad-top buyer-page-container flex flex-col gap-4 md:flex-row md:gap-8 lg:gap-6 lg:pt-8">
        <CategoryListingSidebar
          categories={categories}
          activeCategoryUuid={categoryUuid}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          organicOnly={organicOnly}
          onOrganicOnlyChange={setOrganicOnly}
          locallySourcedOnly={locallySourcedOnly}
          onLocallySourcedOnlyChange={setLocallySourcedOnly}
        />

        <main className="min-w-0 flex-1">
          {isSearchMode && onSearchQueryChange ? (
            <form
              className="mb-4"
              onSubmit={(e) => {
                e.preventDefault()
                onSearchQueryChange(searchDraft)
              }}
            >
              <label className="sr-only" htmlFor="buyer-search-input">
                Search products and farms
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-outline">
                  search
                </span>
                <input
                  id="buyer-search-input"
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoFocus={!trimmedSearch}
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  className="h-12 w-full rounded-full border-none bg-surface-container-low pr-12 pl-11 text-sm placeholder:text-outline focus:ring-2 focus:ring-primary-container sm:text-base"
                  placeholder="Search vegetables, farms…"
                />
                {searchDraft ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchDraft('')
                      onSearchQueryChange('')
                    }}
                    className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          <DeliveryRangeBanner className="mb-4 md:mb-6" />

          <div className="mb-4 hidden flex-col gap-4 md:mb-8 md:flex md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-headline-xl text-on-surface">{pageTitle}</h1>
              <p className="text-body-md text-on-surface-variant">{resultsSubtitle}</p>
            </div>

            <div className="flex w-full items-center gap-4 md:w-auto">
              <span className="text-label-md shrink-0 text-on-surface-variant">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as ProductSort)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2 text-body-md focus:border-primary focus:ring-primary md:w-48"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          <p className="mb-3 text-xs text-on-surface-variant md:hidden">{resultsSubtitle}</p>

          {!isSearchMode ? (
            <div className="mb-4 md:hidden">
              <div className="stitch-hide-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scroll-smooth">
                <Link
                  to="/buyer/categories"
                  className={cn(
                    'shrink-0 snap-start rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                    !categoryUuid
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant bg-surface text-on-surface-variant',
                  )}
                >
                  All
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.uuid}
                    to={`/buyer/categories/${category.uuid}`}
                    className={cn(
                      'flex shrink-0 snap-start items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                      category.uuid === categoryUuid
                        ? 'bg-primary text-on-primary'
                        : 'border border-outline-variant bg-surface text-on-surface-variant',
                    )}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {getCategoryNavIcon(category.name, category.slug)}
                    </span>
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {getApiErrorMessage(error, 'Failed to load products')}
            </p>
          ) : null}

          {isSearchMode && trimmedSearch && (sellersLoading || sellers.length > 0) ? (
            <section className="mb-8 md:mb-10">
              <h2 className="mb-1 text-lg font-bold text-on-surface md:text-xl">Farm Stores</h2>
              <p className="mb-3 text-sm text-on-surface-variant md:mb-4">
                {sellersLoading
                  ? 'Finding local farms…'
                  : `${sellerTotal} store${sellerTotal === 1 ? '' : 's'} matching your search`}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {sellersLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-64 animate-pulse rounded-xl bg-surface-container" />
                    ))
                  : sellers.map((seller) => <SellerCard key={seller.uuid} seller={seller} />)}
              </div>
            </section>
          ) : null}

          {isSearchMode && trimmedSearch && (isLoading || products.length > 0) ? (
            <h2 className="mb-3 text-lg font-bold text-on-surface md:mb-4 md:text-xl">Products</h2>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-52 animate-pulse rounded-xl bg-surface-container sm:h-64 md:h-[22rem]"
                  />
                ))
              : products.map((product) => (
                  <ProductCard
                    key={product.uuid}
                    product={product}
                    layout="grid"
                    showFavorite
                    className="md:hidden"
                  />
                ))}
            {isLoading
              ? null
              : products.map((product) => (
                  <ProductCard
                    key={`u-${product.uuid}`}
                    product={product}
                    layout="uniform"
                    showFavorite
                    className="hidden md:block"
                  />
                ))}
          </div>

          {!isLoading && products.length === 0 && (!isSearchMode || sellers.length === 0) ? (
            <p className="py-12 text-center text-sm text-on-surface-variant">{emptyMessage}</p>
          ) : null}

          <div ref={loadMoreRef} className="h-8 w-full" aria-hidden />

          {isFetchingNextPage ? (
            <div className="mt-2 flex justify-center py-4" role="status" aria-live="polite">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                progress_activity
              </span>
            </div>
          ) : null}
        </main>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={closeFilters}
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1 shadow-2xl"
            style={filterSheetStyle}
          >
            <BottomSheetHandle {...filterHandleProps} />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="touch-none text-lg font-bold text-on-surface" {...filterHandleProps}>
                Filters & sort
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMaxPrice(PRICE_MAX)
                  setOrganicOnly(false)
                  setLocallySourcedOnly(false)
                  setSort('featured')
                }}
                className="text-sm font-semibold text-primary"
              >
                Reset
              </button>
            </div>
            {filterControls}
            <button
              type="button"
              onClick={closeFilters}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-bold text-on-primary"
            >
              Show results
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
