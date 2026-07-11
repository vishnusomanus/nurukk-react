import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { cn } from '@/utils/cn'

const PAGE_SIZE = 12

function normalizeWishlistProducts(data: unknown): BuyerProduct[] {
  if (Array.isArray(data)) return data as BuyerProduct[]
  return extractRows(data) as BuyerProduct[]
}

export function BuyerWishlistPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [reorderError, setReorderError] = useState<string | null>(null)

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

  const reorderAll = useMutation({
    mutationFn: async (items: BuyerProduct[]) => {
      for (const product of items) {
        if (product.is_available === false) continue
        await buyerService.addCartItem({ product_uuid: product.uuid, quantity: 1 })
      }
    },
    onSuccess: () => {
      setReorderError(null)
      queryClient.invalidateQueries({ queryKey: ['buyer', 'cart'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'checkout-preview'] })
      navigate('/buyer/checkout')
    },
    onError: (err) => setReorderError(getApiErrorMessage(err, 'Failed to reorder favorites')),
  })

  const availableCount = products.filter((p) => p.is_available !== false).length

  return (
    <BuyerAccountShell title="Favorites">
      <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-headline-xl mb-1 text-primary">My Favorites</h1>
          <p className="text-body-lg text-on-surface-variant">
            Quickly reorder your most-loved fresh produce.
          </p>
        </div>
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your favorites..."
            className="text-body-md h-11 w-full rounded-full border-none bg-surface-container-low pr-4 pl-10 text-on-surface outline-none transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
          />
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(error, 'Failed to load favorites')}
        </p>
      ) : null}

      {reorderError ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {reorderError}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-16 text-center">
          <span
            className="material-symbols-outlined mb-3 text-5xl text-outline"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            favorite
          </span>
          <p className="text-body-lg text-on-surface-variant">
            {search.trim() ? 'No favorites match your search.' : 'Your favorites list is empty.'}
          </p>
          {!search.trim() ? (
            <Link to="/buyer" className="text-body-md mt-4 inline-block font-bold text-primary hover:underline">
              Browse the marketplace
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pageProducts.map((product) => (
              <WishlistProductCard key={product.uuid} product={product} />
            ))}
          </div>
          {filteredProducts.length > 0 && paginationMeta.last_page > 1 ? (
            <Pagination meta={paginationMeta} onPageChange={setPage} className="mt-8" />
          ) : null}
        </>
      )}

      {recentlyViewed.length > 0 ? (
        <section className="mt-10 border-t border-outline-variant pt-8 lg:mt-12 lg:pt-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-headline-lg text-on-surface">Recently Viewed</h2>
            <Link to="/buyer" className="text-body-md font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="stitch-hide-scrollbar flex gap-4 overflow-x-auto pb-2">
            {recentlyViewed.map((product) => (
              <Link
                key={product.uuid}
                to={`/buyer/products/${product.uuid}`}
                className="w-48 flex-shrink-0 rounded-lg border border-transparent bg-white p-3 shadow-sm transition-all hover:border-outline-variant"
              >
                <div className="mb-2 h-24 overflow-hidden rounded-md">
                  <ProductImage product={product} className="h-full w-full object-cover" />
                </div>
                <p className="text-label-md truncate font-semibold text-on-surface">{product.name}</p>
                <p className="text-xs font-bold text-primary">
                  {formatCurrency(product.discount_price ?? product.price)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {products.length > 0 && availableCount > 0 ? (
        <button
          type="button"
          disabled={reorderAll.isPending}
          onClick={() => reorderAll.mutate(products)}
          className={cn(
            'fixed right-4 z-40 flex h-14 items-center gap-3 rounded-full bg-primary px-6 font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-60 lg:right-8 lg:bottom-8',
            'bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]',
          )}
        >
          <span className="material-symbols-outlined">shopping_basket</span>
          <span className="hidden sm:inline">
            {reorderAll.isPending ? 'Adding to cart…' : 'Reorder All Favorites'}
          </span>
          <span className="sm:hidden">{reorderAll.isPending ? 'Adding…' : 'Reorder All'}</span>
        </button>
      ) : null}
    </BuyerAccountShell>
  )
}
