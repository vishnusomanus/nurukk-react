import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SellerOrder, SellerOrderDetail } from '@/api/services/sellerService'
import * as sellerService from '@/api/services/sellerService'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { cn } from '@/utils/cn'
import { sellerOrderLabel, sellerOrderStatusConfig } from '@/utils/sellerOrderStatus'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

type SellerOrderCardProps = {
  order: SellerOrder
  detail?: SellerOrderDetail
  busy?: boolean
}

export function SellerOrderCard({ order, detail, busy }: SellerOrderCardProps) {
  const queryClient = useQueryClient()
  const status = sellerOrderStatusConfig(order.status)
  const buyerName = detail?.buyer?.name ?? 'Customer'
  const items = detail?.items ?? []
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] })
    queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] })
  }

  const updateStatus = useMutation({
    mutationFn: (nextStatus: string) => sellerService.updateOrderStatus(order.uuid, nextStatus),
    onSuccess: invalidate,
  })

  const rejectOrder = useMutation({
    mutationFn: () => sellerService.rejectOrder(order.uuid),
    onSuccess: invalidate,
  })

  const isPending = busy || updateStatus.isPending || rejectOrder.isPending
  const mutationError = updateStatus.error ?? rejectOrder.error

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface-container-lowest p-6 stitch-card-shadow transition-shadow',
        order.status === 'pending' ? 'border-2 border-primary/20' : 'border-outline-variant/30',
        'hover:shadow-[0px_8px_24px_rgba(46,125,50,0.12)]',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <span className={cn('mb-1 inline-block rounded-full px-3 py-1 text-label-md', status.badgeClass)}>
            {status.label}
          </span>
          <h3 className="text-headline-lg text-on-surface">{sellerOrderLabel(order.order_number, order.uuid)}</h3>
          <p className="text-body-md font-semibold text-on-surface">{buyerName}</p>
        </div>
        <div className="text-right">
          <p className="text-price-display text-primary">{formatCurrency(order.total)}</p>
          <p
            className={cn(
              'flex items-center justify-end gap-1 text-label-md',
              order.status === 'pending' ? 'animate-pulse text-secondary' : 'text-on-surface-variant',
            )}
          >
            <span className="material-symbols-outlined text-[14px]">
              {order.status === 'pending' ? 'notifications_active' : 'schedule'}
            </span>
            {formatRelativeTime(order.created_at)}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-surface-variant/20 p-4">
        <div className="mb-2 flex justify-between">
          <span className="text-label-md text-on-surface-variant">
            Item Summary ({itemCount || items.length} Items)
          </span>
          <Link to={`/seller/orders/${order.uuid}`} className="text-label-md text-primary hover:underline">
            View details
          </Link>
        </div>
        {items.length > 0 ? (
          <ul className="space-y-1 text-body-md text-on-surface">
            {items.slice(0, 3).map((item) => (
              <li key={`${item.product_name}-${item.quantity}`} className="flex justify-between gap-4">
                <span>{item.product_name}</span>
                <span className="text-on-surface-variant">x{item.quantity}</span>
              </li>
            ))}
            {items.length > 3 ? (
              <li className="text-on-surface-variant">+{items.length - 3} more items</li>
            ) : null}
          </ul>
        ) : (
          <p className="text-body-md text-on-surface-variant">Open order to view items.</p>
        )}
      </div>

      {order.status === 'pending' ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => updateStatus.mutate('accepted')}
            className="flex-1 rounded-lg bg-primary py-2 text-body-md font-semibold text-on-primary transition-colors hover:opacity-90"
          >
            Accept Order
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => rejectOrder.mutate()}
            className="flex-1 rounded-lg border border-error py-2 text-body-md font-semibold text-error transition-colors hover:bg-error/5"
          >
            Decline
          </button>
        </div>
      ) : null}

      {order.status === 'accepted' || order.status === 'preparing' ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="flex-1 cursor-not-allowed rounded-lg border border-outline py-2 text-body-md font-semibold text-on-surface opacity-50"
          >
            Accepted
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => updateStatus.mutate('preparing')}
            className={cn(
              'flex-1 rounded-lg py-2 text-body-md font-semibold transition-colors hover:opacity-90',
              order.status === 'preparing' ? 'bg-secondary text-on-secondary' : 'border border-outline text-on-surface hover:bg-surface-variant',
            )}
          >
            Preparing
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => updateStatus.mutate('ready_for_delivery')}
            className="flex-1 rounded-lg border border-primary py-2 text-body-md font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Ready
          </button>
        </div>
      ) : null}

      {order.status === 'ready_for_delivery' ? (
        <Link
          to={`/seller/orders/${order.uuid}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-2 text-body-md font-semibold text-on-primary-container transition-colors hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          View Delivery Details
        </Link>
      ) : null}

      {mutationError ? (
        <p className="mt-3 text-sm text-error">{getApiErrorMessage(mutationError, 'Action failed')}</p>
      ) : null}
    </div>
  )
}
