import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
import type { DeliveryHistoryOrder } from '@/api/services/deliveryService'
import { DeliveryEmptyState, DeliveryHistoryCard } from '@/components/delivery/DeliveryOrderCard'
import { DeliveryPageShell } from '@/components/delivery/DeliveryPageShell'
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
    <DeliveryPageShell pathname="/delivery/history">
      <p className="text-sm leading-relaxed text-on-surface-variant">
        Completed runs and the fee you earned on each.
      </p>

      {error ? (
        <p className="rounded-2xl bg-error-container/25 px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load delivery history')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[1.5rem] bg-surface-container" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <DeliveryEmptyState
          icon="history"
          title="No completed deliveries yet"
          description="Deliveries you finish will appear here with the fee you earned."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <DeliveryHistoryCard key={order.uuid} order={order} />
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </DeliveryPageShell>
  )
}
