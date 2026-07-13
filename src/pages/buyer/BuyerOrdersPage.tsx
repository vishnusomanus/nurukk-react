import { useEffect, useMemo, useRef, useState } from 'react'
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
  filterOrdersByDateRange,
  filterOrdersByTab,
  isCancelledOrderStatus,
  orderDateLabel,
  orderLabel,
  ORDER_DATE_RANGE_OPTIONS,
  reorderOrderItems,
  useOrderSavingsSummary,
  type BuyerOrderTab,
  type OrderDateRange,
} from '@/utils/buyerAccount'
import { resolveOrderTracking } from '@/utils/orderTracking'
import { cn } from '@/utils/cn'

type OrderTab = BuyerOrderTab

const ORDER_TABS: { id: OrderTab; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

function OrdersDateFilter({
  dateRange,
  onDateRangeChange,
  align = 'right',
}: {
  dateRange: OrderDateRange
  onDateRangeChange: (next: OrderDateRange) => void
  align?: 'left' | 'right'
}) {
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const selectedRange =
    ORDER_DATE_RANGE_OPTIONS.find((item) => item.id === dateRange) ?? ORDER_DATE_RANGE_OPTIONS[1]

  useEffect(() => {
    if (!filterOpen) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (target && filterRef.current?.contains(target)) return
      setFilterOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFilterOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [filterOpen])

  return (
    <div ref={filterRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setFilterOpen((open) => !open)}
        aria-expanded={filterOpen}
        aria-haspopup="listbox"
        aria-label={`Date filter: ${selectedRange.label}`}
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-bold transition-colors active:scale-[0.98]',
          filterOpen
            ? 'bg-primary/15 text-primary'
            : 'bg-surface-container-low text-on-surface-variant',
        )}
      >
        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
        <span>{selectedRange.shortLabel}</span>
        <span className="material-symbols-outlined text-[16px]">
          {filterOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {filterOpen ? (
        <div
          role="listbox"
          aria-label="Date range"
          className={cn(
            'absolute top-[calc(100%+0.4rem)] z-50 w-44 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest py-1.5 shadow-[0_12px_28px_rgba(15,40,20,0.14)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">
            Show orders from
          </p>
          {ORDER_DATE_RANGE_OPTIONS.map((item) => {
            const selected = dateRange === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onDateRangeChange(item.id)
                  setFilterOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                  selected
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface hover:bg-surface-container-low',
                )}
              >
                {item.label}
                {selected ? (
                  <span className="material-symbols-outlined text-[18px]">check</span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function StatusPill({
  order,
  active,
}: {
  order: BuyerOrder
  active: boolean
}) {
  const cancelled = isCancelledOrderStatus(order.status)

  if (active) {
    return (
      <div className="flex max-w-[58%] items-center gap-1.5 rounded-full bg-primary-container/10 px-2.5 py-1 text-primary-container">
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary-container" />
        <span className="truncate text-[11px] font-semibold lg:text-xs">
          {activeStatusLabel(order.status, { tracking: resolveOrderTracking(order), order })}
        </span>
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="flex items-center gap-1 rounded-full bg-error-container px-2.5 py-1 text-error">
        <span className="material-symbols-outlined text-[14px]">cancel</span>
        <span className="text-[11px] font-semibold lg:text-xs">Cancelled</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-1 text-on-surface-variant">
      <span className="material-symbols-outlined text-[14px]">check_circle</span>
      <span className="truncate text-[11px] font-semibold capitalize lg:text-xs">
        {order.status.replace(/_/g, ' ')}
      </span>
    </div>
  )
}

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
  const detailTo = `/buyer/orders/${order.uuid}/success`
  const itemSummary =
    items.length > 0
      ? `${items.length} item${items.length === 1 ? '' : 's'}`
      : null

  return (
    <article className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none">
      <Link to={detailTo} className="block p-4 active:bg-surface-container-low/40 lg:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[15px] font-bold text-on-surface lg:text-base">
                {orderLabel(order)}
              </h3>
            </div>
            {dateLabel ? (
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {dateLabel}
                {itemSummary ? ` · ${itemSummary}` : ''}
              </p>
            ) : itemSummary ? (
              <p className="mt-0.5 text-xs text-on-surface-variant">{itemSummary}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusPill order={order} active={active} />
            <p className="text-[15px] font-bold text-on-surface lg:text-base">
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center overflow-hidden -space-x-2.5">
            {visibleItems.length > 0 ? (
              <>
                {visibleItems.map((item, index) => (
                  <div
                    key={`${item.product?.uuid ?? item.product_name ?? index}`}
                    className="h-11 w-11 overflow-hidden rounded-xl border-2 border-surface-container-lowest bg-surface-container lg:h-12 lg:w-12"
                  >
                    <ProductImage
                      product={item.product}
                      className={cn(
                        'h-full w-full object-cover',
                        !active && !cancelled && 'grayscale-[15%]',
                      )}
                    />
                  </div>
                ))}
                {extraCount > 0 ? (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-surface-container-lowest bg-surface-container-high text-[11px] font-bold text-on-surface-variant lg:h-12 lg:w-12">
                    +{extraCount}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-high text-outline lg:h-12 lg:w-12">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              </div>
            )}
          </div>
          <span className="material-symbols-outlined text-outline lg:hidden">chevron_right</span>
          <span className="hidden text-sm font-semibold text-primary lg:inline">View details</span>
        </div>
      </Link>

      {showTrackOrder || (!active && !cancelled) ? (
        <div className="flex gap-2 border-t border-outline-variant/40 px-3 py-2.5 lg:px-5 lg:py-3">
          {showTrackOrder ? (
            <Link
              to={detailTo}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              Track order
            </Link>
          ) : null}
          {!active && !cancelled ? (
            <>
              <Link
                to={`/buyer/orders/${order.uuid}/invoice`}
                className="hidden h-10 flex-1 items-center justify-center rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low lg:flex"
              >
                Invoice
              </Link>
              <button
                type="button"
                disabled={reordering}
                onClick={() => onReorder(order.uuid)}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/8 text-sm font-bold text-primary transition-transform active:scale-[0.98] disabled:opacity-50 lg:bg-primary lg:text-on-primary"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                {reordering ? 'Adding…' : 'Reorder'}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export function BuyerOrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<OrderTab>('active')
  const [dateRange, setDateRange] = useState<OrderDateRange>('3_months')
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
    const scoped = filterOrdersByDateRange(allOrders, dateRange)
    return filterOrdersByTab(scoped, tab)
  }, [allOrders, dateRange, tab])

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
    <BuyerAccountShell
      title="Orders"
      backTo="/buyer"
      showBack={false}
      right={
        <OrdersDateFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      }
    >
      <header className="mb-4 space-y-3 lg:mb-8 lg:space-y-5">
        <div className="hidden items-start justify-between gap-4 lg:flex">
          <div>
            <h1 className="text-headline-xl mb-1 text-primary">Order History</h1>
            <p className="text-body-lg text-on-surface-variant">
              Track deliveries and reorder past harvests.
            </p>
          </div>
          <OrdersDateFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            align="right"
          />
        </div>

        <div
          className="flex gap-1 rounded-full bg-surface-container-lowest p-1 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:max-w-md lg:rounded-xl"
          role="tablist"
          aria-label="Order status"
        >
          {ORDER_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'flex-1 rounded-full px-2.5 py-2.5 text-xs font-bold transition-colors sm:text-sm lg:rounded-lg lg:px-3',
                tab === item.id
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant active:bg-surface-container-low',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(error, 'Failed to load orders')}
        </p>
      ) : null}

      {actionError ? (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-surface-container lg:h-40 lg:rounded-xl"
            />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest py-14 text-center shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/40 lg:shadow-none">
          <span
            className="material-symbols-outlined mb-3 text-5xl text-outline"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            receipt_long
          </span>
          <p className="text-sm text-on-surface-variant lg:text-body-lg">
            {tab === 'active'
              ? 'No active orders right now.'
              : tab === 'cancelled'
                ? 'No cancelled orders.'
                : 'No completed orders yet.'}
          </p>
          <Link to="/buyer" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
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
          className="mt-4 w-full rounded-2xl bg-surface-container-lowest py-3.5 text-sm font-bold text-on-surface-variant shadow-[0_2px_12px_rgba(15,40,20,0.06)] transition-colors active:bg-surface-container-low disabled:opacity-50 lg:mt-6 lg:rounded-xl lg:border lg:border-dashed lg:border-outline-variant lg:shadow-none"
        >
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      ) : null}

      {!isLoading && allOrders.length > 0 ? (
        <div className="mt-6 hidden gap-4 lg:mt-10 lg:grid lg:grid-cols-2">
          <div className="flex items-center gap-6 rounded-xl border border-primary/20 bg-primary-container/10 p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
              <span className="material-symbols-outlined text-3xl">savings</span>
            </div>
            <div>
              <h4 className="mb-1 text-headline-lg font-bold text-primary">Harvest Savings</h4>
              <p className="text-body-md text-on-surface-variant">
                You&apos;ve saved {formatCurrency(savings)} across your orders.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 rounded-xl border border-secondary/20 bg-secondary-container/10 p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
              <span className="material-symbols-outlined text-3xl">eco</span>
            </div>
            <div>
              <h4 className="mb-1 text-headline-lg font-bold text-secondary">Orders Placed</h4>
              <p className="text-body-md text-on-surface-variant">
                {allOrders.length} orders in your harvest history.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </BuyerAccountShell>
  )
}
