import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import type { SellerOrder, SellerOrderDetail } from '@/api/services/sellerService'
import { SellerOrderCard } from '@/components/seller/SellerOrderCard'
import type { SellerOutletContext } from '@/layouts/SellerMarketplaceLayout'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { filterSellerOrdersByTab, type SellerOrderTab } from '@/utils/sellerOrderStatus'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const TABS: Array<{ id: SellerOrderTab; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

export function SellerOrdersPage() {
  const { search } = useOutletContext<SellerOutletContext>()
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<SellerOrderTab>('active')

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'orders', page],
    queryFn: () => sellerService.listOrders({ page, per_page: 12 }),
  })

  const rows = extractRows(data?.data) as SellerOrder[]
  const meta = extractPaginationMeta(data)

  const detailQueries = useQueries({
    queries: rows.map((order) => ({
      queryKey: ['seller', 'orders', order.uuid, 'detail'],
      queryFn: () => sellerService.getOrder(order.uuid),
      staleTime: 30_000,
    })),
  })

  const detailsByUuid = useMemo(() => {
    const map: Record<string, SellerOrderDetail> = {}
    rows.forEach((order, index) => {
      const detail = detailQueries[index]?.data?.data
      if (detail) map[order.uuid] = detail
    })
    return map
  }, [detailQueries, rows])

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    const tabbed = filterSellerOrdersByTab(rows, tab)

    if (!query) return tabbed

    return tabbed.filter((order) => {
      const detail = detailsByUuid[order.uuid]
      const buyerName = detail?.buyer?.name?.toLowerCase() ?? ''
      const orderNumber = order.order_number?.toLowerCase() ?? ''
      return buyerName.includes(query) || orderNumber.includes(query) || order.uuid.includes(query)
    })
  }, [detailsByUuid, rows, search, tab])

  const tabCounts = useMemo(() => {
    return TABS.reduce<Record<SellerOrderTab, number>>(
      (acc, item) => {
        acc[item.id] = filterSellerOrdersByTab(rows, item.id).length
        return acc
      },
      { active: 0, completed: 0, cancelled: 0 },
    )
  }, [rows])

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-xl text-on-surface">Order Management</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Track, accept, and fulfill customer orders in real time.
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load orders')}
        </p>
      ) : null}

      <div className="mb-2 flex overflow-x-auto border-b border-outline-variant stitch-hide-scrollbar">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'px-6 py-4 text-body-md whitespace-nowrap transition-colors',
              tab === item.id
                ? 'border-b-2 border-primary font-bold text-primary'
                : 'text-on-surface-variant hover:text-primary',
            )}
          >
            {item.label} ({tabCounts[item.id]})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center stitch-card-shadow">
          <span className="material-symbols-outlined mb-4 text-5xl text-outline">receipt_long</span>
          <h3 className="text-headline-lg text-on-surface">No orders in this tab</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">New customer orders will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {filteredOrders.map((order) => (
            <SellerOrderCard key={order.uuid} order={order} detail={detailsByUuid[order.uuid]} />
          ))}
        </div>
      )}

      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </div>
  )
}
