import { useMemo, useState } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import type { SellerOrder, SellerOrderDetail } from '@/api/services/sellerService'
import { SellerOrderCard } from '@/components/seller/SellerOrderCard'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import type { SellerOutletContext } from '@/layouts/SellerMarketplaceLayout'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { filterSellerOrdersByTab, type SellerOrderTab } from '@/utils/sellerOrderStatus'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const TABS: Array<{ id: SellerOrderTab; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Done' },
  { id: 'cancelled', label: 'Cancelled' },
]

export function SellerOrdersPage() {
  const location = useLocation()
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
    <SellerPageShell pathname={location.pathname} className="space-y-3 lg:space-y-5">
      <div className="hidden lg:block">
        <h2 className="text-headline-xl text-primary">Order Management</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Track, accept, and fulfill customer orders.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-error/20 bg-error-container px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load orders')}
        </p>
      ) : null}

      <div className="flex gap-1 rounded-full bg-surface-container-lowest p-1 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:max-w-md lg:rounded-xl">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'flex-1 rounded-full px-2 py-2.5 text-xs font-bold transition-colors sm:text-sm lg:rounded-lg',
              tab === item.id
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant active:bg-surface-container-low',
            )}
          >
            {item.label}
            <span className="ml-1 opacity-80">({tabCounts[item.id]})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest py-14 text-center shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/40 lg:shadow-none">
          <span className="material-symbols-outlined mb-3 text-5xl text-outline">receipt_long</span>
          <p className="text-sm text-on-surface-variant">No orders in this tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {filteredOrders.map((order) => (
            <SellerOrderCard key={order.uuid} order={order} detail={detailsByUuid[order.uuid]} />
          ))}
        </div>
      )}

      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </SellerPageShell>
  )
}
