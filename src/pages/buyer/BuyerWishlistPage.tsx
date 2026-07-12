import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerProduct } from '@/api/services/buyerService'
import { BuyerAccountShell } from '@/components/buyer/BuyerAccountShell'
import { ProductImage } from '@/components/buyer/ProductImage'
import { WishlistProductCard } from '@/components/buyer/WishlistProductCard'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency } from '@/utils/formatCurrency'
import { buildClientPaginationMeta, paginateSlice } from '@/utils/clientPagination'
import { extractRows } from '@/utils/extractRows'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

const PAGE_SIZE = 12

function normalizeWishlistProducts(data: unknown): BuyerProduct[] {
  if (Array.isArray(data)) return data as BuyerProduct[]
  return extractRows(data) as BuyerProduct[]
}

export function BuyerWishlistPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'wishlist'],
    queryFn: () => buyerService.listWishlist(),
  })

  const { data: homeData } = useQuery({
    queryKey: ['buyer', 'home'],
    queryFn: () => buyerService.getHome(),
  })

  const products = useMemo(() => normalizeWishlistProducts(data?.data), [data?.data])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((product) => {
      const haystack = [product.name, product.category?.name, product.unit]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [products, search])

  const paginationMeta = useMemo(
    () => buildClientPaginationMeta(filteredProducts.length, page, PAGE_SIZE),
    [filteredProducts.length, page],
  )
  const pageProducts = useMemo(
    () => paginateSlice(filteredProducts, paginationMeta.current_page, PAGE_SIZE),
    [filteredProducts, paginationMeta.current_page],
  )

  const wishlistIds = useMemo(() => new Set(products.map((p) => p.uuid)), [products])

  const recentlyViewed = useMemo(() => {
    const recent = homeData?.data?.recently_purchased ?? []
    return recent.filter((product) => product.uuid && !wishlistIds.has(product.uuid)).slice(0, 6)
  }, [homeData?.data?.recently_purchased, wishlistIds])

  return (
    <BuyerAccountShell title="Favorites">
      <header className="mb-2 space-y-3 lg:mb-8 lg:flex lg:flex-row lg:items-end lg:justify-between lg:gap-4 lg:space-y-0">
        <div className="hidden lg:block">
          <h1 className="text-headline-xl mb-1 text-primary">My Favorites</h1>
          <p className="text-body-lg text-on-surface-variant">
            Quickly reorder your most-loved fresh produce.
          </p>
        </div>
        <div className="relative w-full lg:max-w-md">
          <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your favorites..."
            className="h-11 w-full rounded-full border-none bg-surface-container-lowest pr-4 pl-10 text-sm text-on-surface shadow-[0_2px_12px_rgba(15,40,20,0.06)] outline-none transition-all placeholder:text-outline focus:ring-2 focus:ring-primary lg:bg-surface-container-low lg:text-base lg:shadow-none"
          />
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(error, 'Failed to load favorites')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-surface-container lg:h-72 lg:rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest py-14 text-center shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/40 lg:shadow-none">
          <span
            className="material-symbols-outlined mb-3 text-5xl text-outline"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            favorite
          </span>
          <p className="text-sm text-on-surface-variant lg:text-body-lg">
            {search.trim() ? 'No favorites match your search.' : 'Your favorites list is empty.'}
          </p>
          {!search.trim() ? (
            <Link to="/buyer" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">
              Browse the marketplace
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {pageProducts.map((product) => (
              <WishlistProductCard key={product.uuid} product={product} />
            ))}
          </div>
          {filteredProducts.length > 0 && paginationMeta.last_page > 1 ? (
            <Pagination meta={paginationMeta} onPageChange={setPage} className="mt-6 lg:mt-8" />
          ) : null}
        </>
      )}

      {recentlyViewed.length > 0 ? (
        <section className="mt-6 border-t border-outline-variant/50 pt-5 lg:mt-12 lg:pt-10">
          <div className="mb-4 flex items-center justify-between lg:mb-6">
            <h2 className="text-base font-bold text-on-surface lg:text-headline-lg">Recently Viewed</h2>
            <Link to="/buyer" className="text-sm font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="stitch-hide-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {recentlyViewed.map((product) => (
              <Link
                key={product.uuid}
                to={`/buyer/products/${product.uuid}`}
                className="w-36 shrink-0 rounded-2xl bg-surface-container-lowest p-2.5 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:w-48 lg:rounded-lg lg:border lg:border-transparent lg:bg-white lg:p-3 lg:shadow-sm lg:hover:border-outline-variant"
              >
                <div className="mb-2 h-20 overflow-hidden rounded-xl lg:h-24 lg:rounded-md">
                  <ProductImage product={product} className="h-full w-full object-cover" />
                </div>
                <p className="truncate text-xs font-semibold text-on-surface lg:text-label-md">{product.name}</p>
                <p className="text-xs font-bold text-primary">
                  {formatCurrency(product.discount_price ?? product.price)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </BuyerAccountShell>
  )
}
