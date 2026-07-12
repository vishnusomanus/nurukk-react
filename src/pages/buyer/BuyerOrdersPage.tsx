import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerOrder, BuyerOrderItem } from '@/api/services/buyerService'
import { BuyerAccountShell } from '@/components/buyer/BuyerAccountShell'
import { ProductImage } from '@/components/buyer/ProductImage'
import { formatCurrency } from '@/utils/formatCurrency'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import {
  activeStatusLabel,
  canTrackBuyerOrder,
  filterOrdersByRecentMonths,
  filterOrdersByTab,
  isCancelledOrderStatus,
  orderDateLabel,
  orderLabel,
  reorderOrderItems,
  useOrderSavingsSummary,
} from '@/utils/buyerAccount'
import { resolveOrderTracking } from '@/utils/orderTracking'
import { cn } from '@/utils/cn'

type OrderTab = 'active' | 'completed'

function OrderCard({
  order,
  items,
  active = false,
  onReorder,
  reordering,
}: {
  order: BuyerOrder
  items: BuyerOrderItem[]
  active?: boolean
  onReorder: (uuid: string) => void
  reordering: boolean
}) {
  const visibleItems = items.slice(0, 3)
  const extraCount = Math.max(items.length - 3, 0)
  const dateLabel = orderDateLabel(order)
  const showTrackOrder = active && canTrackBuyerOrder(order)
  const cancelled = isCancelledOrderStatus(order.status)

  return (
    <div className="stitch-card-shadow stitch-order-card-hover rounded-2xl bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:p-6 lg:shadow-none">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center lg:mb-6 lg:gap-4">
        <div className="flex flex-wrap items-center gap-2 lg:gap-4">
          <span className="text-base font-bold text-on-background lg:text-headline-lg">{orderLabel(order)}</span>
          {active ? (
            <div className="flex items-center gap-1 rounded-full bg-primary-container/10 px-3 py-1 text-primary-container lg:px-4">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
              <span className="text-xs font-semibold lg:text-label-md">
                {activeStatusLabel(order.status, { tracking: resolveOrderTracking(order), order })}
              </span>
            </div>
          ) : cancelled ? (
            <div className="flex items-center gap-1 rounded-full bg-error-container px-3 py-1 text-error lg:px-4">
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span className="text-xs font-semibold lg:text-label-md">Cancelled</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-on-surface-variant lg:px-4">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span className="text-xs font-semibold capitalize lg:text-label-md">
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
          )}
          {dateLabel ? (
            <span className="w-full text-xs text-on-surface-variant lg:w-auto lg:text-body-md">
              Ordered on {dateLabel}
            </span>
          ) : null}
        </div>
        <div className="text-lg font-bold text-on-background lg:text-price-display">
          {formatCurrency(order.total)}
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex items-center overflow-hidden -space-x-3 lg:-space-x-4">
          {visibleItems.map((item, index) => (
            <div
              key={`${item.product?.uuid ?? item.product_name ?? index}`}
              className="h-12 w-12 overflow-hidden rounded-xl border-2 border-surface bg-surface-container lg:h-16 lg:w-16"
            >
              <ProductImage
                product={item.product}
                className={cn('h-full w-full object-cover', !active && !cancelled && 'grayscale-[15%]')}
              />
            </div>
          ))}
          {extraCount > 0 ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-surface bg-surface-container-high text-xs font-semibold text-on-surface-variant lg:h-16 lg:w-16 lg:text-label-md">
              +{extraCount}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:gap-3">
          <Link
            to={`/buyer/orders/${order.uuid}/success`}
            className="flex flex-1 items-center justify-center rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/5 lg:flex-none lg:px-6 lg:text-label-md"
          >
            Details
          </Link>
          {showTrackOrder ? (
            <Link
              to={`/buyer/orders/${order.uuid}/success`}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-all hover:shadow-lg active:scale-95 lg:flex-none lg:px-6 lg:text-label-md"
            >
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              Track
            </Link>
          ) : !active && !cancelled ? (
            <>
              <Link
                to={`/buyer/orders/${order.uuid}/invoice`}
                className="flex flex-1 items-center justify-center rounded-xl border border-outline px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-low lg:flex-none lg:px-6 lg:text-label-md"
              >
                Invoice
              </Link>
              <button
                type="button"
                disabled={reordering}
                onClick={() => onReorder(order.uuid)}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/5 disabled:opacity-50 lg:flex-none lg:px-6 lg:text-label-md"
              >
                <span className="material-symbols-outlined text-[18px]">reorder</span>
                {reordering ? 'Adding…' : 'Reorder'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function BuyerOrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<OrderTab>('active')
  const [recentOnly, setRecentOnly] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reorderingUuid, setReorderingUuid] = useState<string | null>(null)

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['buyer', 'orders'],
    queryFn: ({ pageParam = 1 }) => buyerService.listOrders({ page: pageParam, per_page: 15 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = extractPaginationMeta(lastPage)
      if (!meta || meta.current_page >= meta.last_page) return undefined
      return meta.current_page + 1
    },
  })

  const allOrders = useMemo(
    () => (data?.pages.flatMap((page) => extractRows(page.data)) ?? []) as BuyerOrder[],
    [data?.pages],
  )

  const filteredOrders = useMemo(() => {
    const scoped = recentOnly ? filterOrdersByRecentMonths(allOrders) : allOrders
    return filterOrdersByTab(scoped, tab)
  }, [allOrders, recentOnly, tab])

  const detailQueries = useQueries({
    queries: filteredOrders.map((order) => ({
      queryKey: ['buyer', 'order', order.uuid],
      queryFn: () => buyerService.getOrder(order.uuid),
      staleTime: 60_000,
    })),
  })

  const itemsByOrderUuid = useMemo(() => {
    const map = new Map<string, BuyerOrderItem[]>()
    filteredOrders.forEach((order, index) => {
      map.set(order.uuid, detailQueries[index]?.data?.data?.items ?? [])
    })
    return map
  }, [detailQueries, filteredOrders])

  const { savings } = useOrderSavingsSummary(allOrders)

  const reorderMutation = useMutation({
    mutationFn: reorderOrderItems,
    onMutate: (uuid) => {
      setReorderingUuid(uuid)
      setActionError(null)
    },
    onSuccess: (added) => {
      queryClient.invalidateQueries({ queryKey: ['buyer', 'cart'] })
      if (added === 0) {
        setActionError('No items from this order could be added to your cart.')
        return
      }
      navigate('/buyer/checkout')
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Failed to reorder')),
    onSettled: () => setReorderingUuid(null),
  })

  return (
    <BuyerAccountShell title="Orders" backTo="/buyer" showBack={false}>
      <header className="mb-4 lg:mb-8">
        <h1 className="text-headline-xl mb-4 hidden text-on-surface lg:block">Order History</h1>
        <div className="flex flex-col gap-3 border-b border-outline-variant/50 sm:flex-row sm:items-center sm:justify-between lg:gap-4">
          <div className="flex gap-1 rounded-xl bg-surface-container-lowest p-1 shadow-[0_2px_12px_rgba(15,40,20,0.06)] sm:gap-8 sm:rounded-none sm:bg-transparent sm:p-0 sm:shadow-none">
            <button
              type="button"
              onClick={() => setTab('active')}
              className={cn(
                'relative flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:flex-none sm:rounded-none sm:px-0 sm:pb-4 sm:text-label-md',
                tab === 'active' ? 'bg-primary text-on-primary sm:bg-transparent sm:text-primary' : 'text-on-surface-variant hover:text-primary',
              )}
            >
              Active
              {tab === 'active' ? (
                <span className="absolute bottom-0 left-0 hidden h-0.5 w-full bg-primary sm:block" />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setTab('completed')}
              className={cn(
                'relative flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:flex-none sm:rounded-none sm:px-0 sm:pb-4 sm:text-label-md',
                tab === 'completed' ? 'bg-primary text-on-primary sm:bg-transparent sm:text-primary' : 'text-on-surface-variant hover:text-primary',
              )}
            >
              Completed
              {tab === 'completed' ? (
                <span className="absolute bottom-0 left-0 hidden h-0.5 w-full bg-primary sm:block" />
              ) : null}
            </button>
          </div>
          <div className="mb-0 flex items-center gap-4 sm:mb-0">
            <button
              type="button"
              onClick={() => setRecentOnly((value) => !value)}
              className={cn(
                'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors lg:text-label-md lg:px-4',
                recentOnly
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low',
              )}
            >
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              Last 3 Months
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(error, 'Failed to load orders')}
        </p>
      ) : null}

      {actionError ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <p className="py-16 text-center text-on-surface-variant">
          {tab === 'active' ? 'No active orders.' : 'No completed orders yet.'}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.uuid}
              order={order}
              items={itemsByOrderUuid.get(order.uuid) ?? []}
              active={tab === 'active'}
              reordering={reorderMutation.isPending && reorderingUuid === order.uuid}
              onReorder={(uuid) => reorderMutation.mutate(uuid)}
            />
          ))}
        </div>
      )}

      {hasNextPage ? (
        <button
          type="button"
          disabled={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
          className="mt-6 w-full rounded-xl border-2 border-dashed border-outline-variant py-4 font-bold text-on-surface-variant transition-all hover:bg-surface-container disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Loading…' : 'Load More History'}
        </button>
      ) : null}

      {!isLoading && allOrders.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:mt-10 lg:gap-4">
          <div className="flex items-center gap-4 rounded-2xl bg-primary-container/10 px-4 py-4 lg:gap-6 lg:border lg:border-primary/20 lg:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary lg:h-16 lg:w-16">
              <span className="material-symbols-outlined text-2xl lg:text-3xl">savings</span>
            </div>
            <div>
              <h4 className="mb-0.5 text-base font-bold text-primary lg:mb-1 lg:text-headline-lg">Harvest Savings</h4>
              <p className="text-sm text-on-surface-variant lg:text-body-md">
                You&apos;ve saved {formatCurrency(savings)} across your orders.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-secondary-container/10 px-4 py-4 lg:gap-6 lg:border lg:border-secondary/20 lg:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary lg:h-16 lg:w-16">
              <span className="material-symbols-outlined text-2xl lg:text-3xl">eco</span>
            </div>
            <div>
              <h4 className="mb-0.5 text-base font-bold text-secondary lg:mb-1 lg:text-headline-lg">Orders Placed</h4>
              <p className="text-sm text-on-surface-variant lg:text-body-md">
                {allOrders.length} orders in your harvest history.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </BuyerAccountShell>
  )
}
