import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerProduct } from '@/api/services/buyerService'
import {
  AdminCatalogProductCard,
  filterCatalogProducts,
  type CatalogFilter,
} from '@/components/admin/AdminCatalogProductCard'
import { Pagination } from '@/components/ui/Pagination'
import type { AdminOutletContext } from '@/layouts/AdminMarketplaceLayout'
import { buildClientPaginationMeta, paginateSlice } from '@/utils/clientPagination'
import { extractRows } from '@/utils/extractRows'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 12

const FILTERS: Array<{ id: CatalogFilter; label: string }> = [
  { id: 'all', label: 'All Products' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'available', label: 'Available' },
]

export function AdminCatalogPage() {
  const { search } = useOutletContext<AdminOutletContext>()
  const [filter, setFilter] = useState<CatalogFilter>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [filter, search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'catalog', 'products'],
    queryFn: () => buyerService.listProducts({ per_page: 100 }),
  })

  const products = extractRows(data?.data) as BuyerProduct[]

  const filtered = useMemo(
    () => filterCatalogProducts(products, filter, search),
    [filter, products, search],
  )

  const paginationMeta = useMemo(
    () => buildClientPaginationMeta(filtered.length, page, PAGE_SIZE),
    [filtered.length, page],
  )
  const pageProducts = useMemo(
    () => paginateSlice(filtered, paginationMeta.current_page, PAGE_SIZE),
    [filtered, paginationMeta.current_page],
  )

  const hiddenHighlight = pageProducts.find((product) => product.is_available === false)

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-headline-xl text-on-surface">Catalog Moderation</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Review marketplace listings, visibility, and seller catalog health.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-label-md transition-all',
                filter === item.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
              )}
            >
              {item.label}
              {item.id === 'hidden' ? ` (${products.filter((p) => p.is_available === false).length})` : null}
            </button>
          ))}
        </div>
        <span className="text-label-md text-on-surface-variant">
          Showing {pageProducts.length} of {filtered.length} listings
        </span>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load catalog')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant px-6 py-16 text-center stitch-card-shadow">
          <span className="material-symbols-outlined mb-4 text-5xl text-outline">inventory_2</span>
          <h3 className="text-headline-lg text-on-surface">No listings match this filter</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filter !== 'available' && hiddenHighlight ? (
            <AdminCatalogProductCard product={hiddenHighlight} highlighted />
          ) : null}
          {pageProducts
            .filter((product) => product.uuid !== hiddenHighlight?.uuid || filter === 'available')
            .map((product) => (
              <AdminCatalogProductCard key={product.uuid} product={product} />
            ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <Pagination meta={paginationMeta} onPageChange={setPage} />
      ) : null}
    </div>
  )
}
