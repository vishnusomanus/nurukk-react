import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { MarketplaceSearchResponse } from '@/api/services/buyerService'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { DeliveryRangeBanner } from '@/components/buyer/DeliveryRangeBanner'
import { CategoryListingPagination } from '@/components/buyer/CategoryListingPagination'
import { CategoryListingSidebar } from '@/components/buyer/CategoryListingSidebar'
import { ProductCard } from '@/components/buyer/ProductCard'
import { SellerCard } from '@/components/buyer/SellerCard'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import type { PaginationMeta } from '@/components/ui/Pagination'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getCategoryNavIcon } from '@/utils/categoryNav'
import { useDeliveryScopeParams } from '@/hooks/useDeliveryScopeParams'
import {
  filterProductsByDietary,
  sortProducts,
  type ProductSort,
} from '@/utils/productListing'
import { cn } from '@/utils/cn'

const PER_PAGE = 12
const PRICE_MAX = 500

function extractSearchProductMeta(response: MarketplaceSearchResponse | undefined): PaginationMeta | null {
  const productsMeta = response?.meta?.products
  if (!productsMeta) return extractPaginationMeta(response)
  const perPage = Math.max(1, productsMeta.per_page)
  const total = Math.max(0, productsMeta.total)
  return {
    current_page: Math.max(1, productsMeta.current_page),
    per_page: perPage,
    total,
    last_page: Math.max(1, Math.ceil(total / perPage)),
  }
}

export function CategoryListingView({
  categoryUuid,
  searchQuery,
  title = 'Fresh Vegetables',
  backTo = '/buyer',
  emptyMessage = 'No products match your filters yet.',
}: {
  categoryUuid?: string | null
  searchQuery?: string
  title?: string
  backTo?: string
  emptyMessage?: string
}) {
  const trimmedSearch = searchQuery?.trim() ?? ''
  const isSearchMode = searchQuery !== undefined
  const deliveryScope = useDeliveryScopeParams()

  const [page, setPage] = useState(1)
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX)
  const [organicOnly, setOrganicOnly] = useState(false)
  const [locallySourcedOnly, setLocallySourcedOnly] = useState(false)
  const [sort, setSort] = useState<ProductSort>('featured')

  useEffect(() => {
    setPage(1)
  }, [categoryUuid, trimmedSearch, maxPrice, organicOnly, locallySourcedOnly, deliveryScope.latitude, deliveryScope.longitude])

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
      ? tagOptions.find((tag) => tag.value === 'organic')?.value ?? 'organic'
      : locallySourcedOnly && !organicOnly
        ? tagOptions.find((tag) => tag.value === 'locally_sourced')?.value ?? 'locally_sourced'
        : undefined

  const searchQueryResult = useQuery({
    queryKey: ['buyer', 'search', trimmedSearch, page, deliveryScope.latitude, deliveryScope.longitude],
    queryFn: () =>
      buyerService.searchProducts({
        q: trimmedSearch,
        page,
        per_page: PER_PAGE,
        seller_per_page: 6,
        ...deliveryScope,
      }),
    enabled: isSearchMode && trimmedSearch.length > 0,
  })

  const categoryQueryResult = useQuery({
    queryKey: ['buyer', 'category-products', categoryUuid, page, deliveryScope.latitude, deliveryScope.longitude],
    queryFn: () =>
      buyerService.listCategoryProducts(categoryUuid!, { page, per_page: PER_PAGE, ...deliveryScope }),
    enabled: !isSearchMode && !!categoryUuid,
  })

  const browseQueryResult = useQuery({
    queryKey: ['buyer', 'category-listing', page, maxPrice, apiTag, deliveryScope.latitude, deliveryScope.longitude],
    queryFn: () =>
      buyerService.listProducts({
        page,
        per_page: PER_PAGE,
        max_price: maxPrice < PRICE_MAX ? maxPrice : undefined,
        tag: apiTag,
        ...deliveryScope,
      }),
    enabled: !isSearchMode && !categoryUuid,
  })

  const activeQuery = isSearchMode
    ? searchQueryResult
    : categoryUuid
      ? categoryQueryResult
      : browseQueryResult

  const { isLoading, error } = activeQuery

  const sellers = isSearchMode ? (searchQueryResult.data?.data?.sellers ?? []) : []
  const sellerTotal = isSearchMode
    ? (searchQueryResult.data?.meta?.sellers?.total ?? sellers.length)
    : 0
  const sellersLoading = isSearchMode && searchQueryResult.isLoading

  const products = useMemo(() => {
    const rows = isSearchMode
      ? (searchQueryResult.data?.data?.products ?? [])
      : categoryUuid
        ? (categoryQueryResult.data?.data ?? [])
        : (browseQueryResult.data?.data ?? [])
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
    searchQueryResult.data?.data?.products,
    categoryUuid,
    categoryQueryResult.data?.data,
    browseQueryResult.data?.data,
    organicOnly,
    locallySourcedOnly,
    maxPrice,
    sort,
  ])

  const paginationMeta = isSearchMode
    ? extractSearchProductMeta(searchQueryResult.data)
    : extractPaginationMeta(activeQuery.data)
  const totalItems = paginationMeta?.total ?? products.length

  const resultsSubtitle = (() => {
    if (isLoading) return 'Loading fresh picks…'
    if (isSearchMode && !trimmedSearch) {
      return 'Enter a search term from the home page'
    }
    if (isSearchMode && trimmedSearch) {
      const productPart = `${totalItems} product${totalItems === 1 ? '' : 's'}`
      const sellerPart =
        sellerTotal > 0 ? `, ${sellerTotal} farm store${sellerTotal === 1 ? '' : 's'}` : ''
      return `Showing ${productPart}${sellerPart} for "${trimmedSearch}"`
    }
    return `Showing ${totalItems} locally harvested item${totalItems === 1 ? '' : 's'}`
  })()

  return (
    <div className="pb-24 lg:pb-8">
      <BuyerPageHeader title={pageTitle} backTo={backTo} />

      <div className="buyer-page-container flex flex-col gap-6 pt-20 md:flex-row md:gap-8 lg:pt-8">
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
          <DeliveryRangeBanner className="mb-6" />
          <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
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

          <div className="mb-6 md:hidden">
            <div className="stitch-hide-scrollbar flex gap-2 overflow-x-auto pb-2">
              <Link
                to="/buyer/categories"
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-body-md font-semibold transition-colors',
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
                    'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-body-md font-semibold transition-colors',
                    category.uuid === categoryUuid
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant bg-surface text-on-surface-variant',
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {getCategoryNavIcon(category.name, category.slug)}
                  </span>
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {error ? (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {getApiErrorMessage(error, 'Failed to load products')}
            </p>
          ) : null}

          {isSearchMode && trimmedSearch && (sellersLoading || sellers.length > 0) ? (
            <section className="mb-10">
              <h2 className="text-headline-lg mb-1 text-on-surface">Farm Stores</h2>
              <p className="text-body-md mb-4 text-on-surface-variant">
                {sellersLoading
                  ? 'Finding local farms…'
                  : `${sellerTotal} store${sellerTotal === 1 ? '' : 's'} matching your search`}
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sellersLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-64 animate-pulse rounded-xl bg-surface-container" />
                    ))
                  : sellers.map((seller) => <SellerCard key={seller.uuid} seller={seller} />)}
              </div>
            </section>
          ) : null}

          {isSearchMode && trimmedSearch && (isLoading || products.length > 0) ? (
            <h2 className="text-headline-lg mb-4 text-on-surface">Products</h2>
          ) : null}

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[22rem] animate-pulse rounded-xl bg-surface-container"
                  />
                ))
              : products.map((product) => (
                  <ProductCard
                    key={product.uuid}
                    product={product}
                    layout="uniform"
                    showFavorite
                    clickAddsToCart
                  />
                ))}
          </div>

          {!isLoading && products.length === 0 && (!isSearchMode || sellers.length === 0) ? (
            <p className="py-12 text-center text-on-surface-variant">{emptyMessage}</p>
          ) : null}

          {paginationMeta ? (
            <CategoryListingPagination
              meta={paginationMeta}
              onPageChange={setPage}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}
