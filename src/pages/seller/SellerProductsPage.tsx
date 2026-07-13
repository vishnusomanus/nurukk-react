import { useMemo, useState } from 'react'
import { Link, useLocation, useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import * as sellerService from '@/api/services/sellerService'
import type { SellerProduct } from '@/api/services/sellerService'
import { SellerProductCard } from '@/components/seller/SellerProductCard'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import type { SellerOutletContext } from '@/layouts/SellerMarketplaceLayout'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'
import { getProductTagValues, getProductTags } from '@/utils/productListing'

export function SellerProductsPage() {
  const location = useLocation()
  const { search } = useOutletContext<SellerOutletContext>()
  const [page, setPage] = useState(1)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'products', page],
    queryFn: () => sellerService.listProducts({ page, per_page: 12 }),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['buyer', 'product-tags'],
    queryFn: () => buyerService.listProductTags(),
    staleTime: 60_000,
  })

  const rows = extractRows(data?.data) as SellerProduct[]
  const meta = extractPaginationMeta(data)
  const tagOptions = tagsData?.data ?? []

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((product) => {
      const tags = getProductTags(product as Record<string, unknown>)
      const tagValues = getProductTagValues(product as Record<string, unknown>)
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        tags.some((tag) => tag.label.toLowerCase().includes(query) || tag.value.toLowerCase().includes(query))

      const matchesTag = !activeTag || tagValues.includes(activeTag)

      return matchesSearch && matchesTag
    })
  }, [activeTag, rows, search])

  return (
    <SellerPageShell pathname={location.pathname} className="space-y-3 lg:space-y-5">
      <div className="hidden items-end justify-between gap-4 lg:flex">
        <div>
          <h2 className="text-headline-xl text-primary">Products</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Manage your farm-fresh catalogue.</p>
        </div>
        <Link
          to="/seller/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add product
        </Link>
      </div>

      <div className="stitch-hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors',
            activeTag == null
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant shadow-[0_2px_12px_rgba(15,40,20,0.06)]',
          )}
        >
          All
        </button>
        {tagOptions.map((tag) => (
          <button
            key={tag.value}
            type="button"
            onClick={() => setActiveTag(tag.value)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors',
              activeTag === tag.value
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-lowest text-on-surface-variant shadow-[0_2px_12px_rgba(15,40,20,0.06)]',
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-2xl border border-error/20 bg-error-container px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load products')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-2xl bg-surface-container lg:h-72" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest py-14 text-center shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/40 lg:shadow-none">
          <span className="material-symbols-outlined mb-3 text-5xl text-outline">inventory_2</span>
          <p className="text-sm text-on-surface-variant">No products found.</p>
          <Link to="/seller/products/new" className="mt-4 inline-block text-sm font-bold text-primary">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-4">
          {filteredProducts.map((product) => (
            <SellerProductCard key={product.uuid} product={product} />
          ))}
        </div>
      )}

      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </SellerPageShell>
  )
}
