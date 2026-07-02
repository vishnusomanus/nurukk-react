import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listSellers, type AdminSeller } from '@/api/services/adminSellersService'
import { AdminSellerCard } from '@/components/admin/AdminSellerCard'
import type { AdminOutletContext } from '@/layouts/AdminMarketplaceLayout'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all'

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
]

export function AdminSellerVerificationPage() {
  const { search } = useOutletContext<AdminOutletContext>()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<StatusFilter>('pending')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'sellers', status, page],
    queryFn: () =>
      listSellers({
        page,
        per_page: 9,
        status: status === 'all' ? undefined : status,
      }),
  })

  const rows = extractRows(data?.data) as AdminSeller[]
  const meta = extractPaginationMeta(data)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(
      (seller) =>
        seller.name.toLowerCase().includes(query) ||
        (seller.city ?? '').toLowerCase().includes(query) ||
        (seller.phone ?? '').includes(query),
    )
  }, [rows, search])

  const pendingCount = status === 'pending' ? meta?.total ?? filtered.length : filtered.length

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-1 text-headline-xl text-on-surface">Seller Verification</h1>
          <p className="text-body-lg text-on-surface-variant">
            Review and manage {pendingCount} farm application{pendingCount === 1 ? '' : 's'}.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => {
              setStatus(filter.id)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-6 py-2 text-label-md transition-all',
              status === filter.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load sellers')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant px-6 py-16 text-center stitch-card-shadow">
          <span className="material-symbols-outlined mb-4 text-5xl text-outline">verified_user</span>
          <h3 className="text-headline-lg text-on-surface">No applications found</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((seller, index) => (
            <AdminSellerCard key={seller.uuid} seller={seller} imageIndex={index} />
          ))}
        </div>
      )}

      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </div>
  )
}
