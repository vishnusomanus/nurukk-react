import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
import type { DeliveryHistoryOrder } from '@/api/services/deliveryService'
import { DeliveryEmptyState, DeliveryHistoryCard } from '@/components/delivery/DeliveryOrderCard'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

export function DeliveryHistoryPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery', 'orders', 'history', page],
    queryFn: () => deliveryService.listOrderHistory({ page, per_page: 10 }),
  })

  const orders = extractRows(data?.data) as DeliveryHistoryOrder[]
  const meta = extractPaginationMeta(data)

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-2">
        <h2 className="text-headline-xl text-on-surface">Order History</h2>
        <p className="text-body-md text-on-surface-variant">
          Completed deliveries and fees earned per order.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load delivery history')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <DeliveryEmptyState
          icon="history"
          title="No completed deliveries yet"
          description="Deliveries you finish will appear here with the fee you earned."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <DeliveryHistoryCard key={order.uuid} order={order} />
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </div>
  )
}
