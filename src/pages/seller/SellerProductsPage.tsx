import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import type { SellerProduct } from '@/api/services/sellerService'
import { SellerProductCard } from '@/components/seller/SellerProductCard'
import type { SellerOutletContext } from '@/layouts/SellerMarketplaceLayout'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'
import { getProductTags } from '@/utils/productListing'

const CATEGORY_FILTERS = ['All Items', 'Leafy', 'Root', 'Pre-cut', 'Fruits'] as const

export function SellerProductsPage() {
  const { search } = useOutletContext<SellerOutletContext>()
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<(typeof CATEGORY_FILTERS)[number]>('All Items')

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'products', page],
    queryFn: () => sellerService.listProducts({ page, per_page: 12 }),
  })

  const rows = extractRows(data?.data) as SellerProduct[]
  const meta = extractPaginationMeta(data)

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((product) => {
      const tags = getProductTags(product)
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        tags.some((tag) => tag.label.toLowerCase().includes(query) || tag.value.toLowerCase().includes(query))

      const categoryQuery = category.toLowerCase().replace('-', '').replace(' ', '')
      const matchesCategory =
        category === 'All Items' ||
        tags.some(
          (tag) =>
            tag.label.toLowerCase().replace('-', '').replace(' ', '').includes(categoryQuery) ||
            tag.value.toLowerCase().includes(categoryQuery),
        )

      return matchesSearch && matchesCategory
    })
  }, [category, rows, search])

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-xl text-on-surface">Inventory Management</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Monitor and manage your farm-fresh produce stock levels.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setCategory(filter)}
              className={cn(
                'rounded-full border px-4 py-1 text-label-md transition-colors',
                category === filter
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline text-on-surface-variant hover:border-primary hover:text-primary',
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load products')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center stitch-card-shadow">
          <span className="material-symbols-outlined mb-4 text-5xl text-outline">inventory_2</span>
          <h3 className="text-headline-lg text-on-surface">No products found</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Add your first product to start selling on the marketplace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <SellerProductCard key={product.uuid} product={product} />
          ))}
        </div>
      )}

      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </div>
  )
}
