import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
import {
  DeliveryEmptyState,
  DeliveryOrderCard,
  type DeliveryOrder,
} from '@/components/delivery/DeliveryOrderCard'
import { DeliveryPageShell } from '@/components/delivery/DeliveryPageShell'
import { Pagination } from '@/components/ui/Pagination'
import { useAuthStore } from '@/store/authStore'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

function primaryCtaClassName(tone: 'primary' | 'secondary' = 'primary') {
  return cn(
    'flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60',
    tone === 'primary'
      ? 'bg-primary text-on-primary shadow-[0_10px_22px_-8px_rgba(13,99,27,0.45)]'
      : 'bg-secondary text-on-secondary shadow-[0_10px_22px_-8px_rgba(150,73,0,0.35)]',
  )
}

type DeliveryTab = 'available' | 'assigned'

const TABS: Array<{ id: DeliveryTab; label: string; icon: string }> = [
  { id: 'available', label: 'Available', icon: 'inventory_2' },
  { id: 'assigned', label: 'My deliveries', icon: 'local_shipping' },
]

export function DeliveryOrdersPage() {
  const queryClient = useQueryClient()
  const userRole = useAuthStore((s) => s.user?.role)
  const [tab, setTab] = useState<DeliveryTab>('available')
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: profileData } = useQuery({
    queryKey: ['delivery', 'profile'],
    queryFn: () => deliveryService.getProfile(),
    retry: false,
  })

  const isPlatformAgent = useMemo(() => {
    const profileType = profileData?.data?.type
    if (profileType === 'platform_agent') return true
    if (profileType === 'seller_employee') return false
    return userRole === 'delivery_agent'
  }, [profileData?.data?.type, userRole])

  const { data: activeCheckData } = useQuery({
    queryKey: ['delivery', 'orders', 'active-check'],
    queryFn: () => deliveryService.listAssignedOrders({ page: 1, per_page: 1 }),
    refetchInterval: 15_000,
  })

  const hasActiveDelivery = useMemo(() => {
    const meta = extractPaginationMeta(activeCheckData)
    if (meta?.total != null && meta.total > 0) return true
    return extractRows(activeCheckData?.data).length > 0
  }, [activeCheckData])

  useEffect(() => {
    if (hasActiveDelivery && tab === 'available') {
      setTab('assigned')
    }
  }, [hasActiveDelivery, tab])

  useEffect(() => {
    setPage(1)
  }, [tab])

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['delivery', 'orders', tab, page, isPlatformAgent],
    queryFn: () =>
      tab === 'assigned'
        ? deliveryService.listAssignedOrders({ page, per_page: 10 })
        : deliveryService.listAvailableOrders({
            page: isPlatformAgent ? 1 : page,
            per_page: isPlatformAgent ? 1 : 10,
          }),
    enabled: tab === 'assigned' || !hasActiveDelivery,
    refetchInterval: tab === 'available' && isPlatformAgent && !hasActiveDelivery ? 15_000 : false,
  })

  const accept = useMutation({
    mutationFn: (uuid: string) => deliveryService.acceptOrder(uuid),
    onMutate: () => setActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'orders'] })
      setTab('assigned')
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Could not accept this order. It may have been taken.')),
  })

  const deliver = useMutation({
    mutationFn: (uuid: string) => deliveryService.markDelivered(uuid),
    onMutate: () => setActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'orders'] })
      setTab('available')
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Failed to mark order as delivered')),
  })

  const reachedPickup = useMutation({
    mutationFn: (uuid: string) => deliveryService.markReachedPickup(uuid),
    onMutate: () => setActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'orders'] })
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Failed to update delivery status')),
  })

  const collectPackage = useMutation({
    mutationFn: (uuid: string) => deliveryService.markPackageCollected(uuid),
    onMutate: () => setActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'orders'] })
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Failed to update delivery status')),
  })

  const reached = useMutation({
    mutationFn: (uuid: string) => deliveryService.markReachedCustomer(uuid),
    onMutate: () => setActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'orders'] })
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Failed to update delivery status')),
  })

  const orders = extractRows(data?.data) as DeliveryOrder[]
  const meta = extractPaginationMeta(data)
  const showPagination = tab === 'assigned' || !isPlatformAgent

  return (
    <DeliveryPageShell pathname="/delivery">
      <p className="text-sm leading-relaxed text-on-surface-variant">
        {hasActiveDelivery
          ? 'Finish your current delivery before accepting a new order.'
          : isPlatformAgent
            ? 'One shared queue order at a time — first to accept gets the run.'
            : 'Ready store orders and your active runs.'}
      </p>

      <div className="flex gap-2 rounded-full bg-surface-container-high/80 p-1 shadow-[inset_0_1px_2px_rgba(15,40,20,0.06)]">
        {TABS.map((item) => {
          const locked = item.id === 'available' && hasActiveDelivery
          return (
            <button
              key={item.id}
              type="button"
              disabled={locked}
              onClick={() => {
                if (!locked) setTab(item.id)
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold transition-all',
                tab === item.id
                  ? 'bg-primary text-on-primary shadow-[0_6px_16px_-6px_rgba(13,99,27,0.5)]'
                  : 'text-on-surface-variant',
                locked && 'cursor-not-allowed opacity-45',
              )}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>

      {error ? (
        <p className="rounded-2xl bg-error-container/25 px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load orders')}
        </p>
      ) : null}

      {actionError ? (
        <p className="rounded-2xl bg-error-container/25 px-4 py-3 text-sm text-error">{actionError}</p>
      ) : null}

      {hasActiveDelivery ? (
        <div className="flex items-start gap-3 rounded-2xl bg-secondary-container/20 px-4 py-3 text-sm text-on-surface">
          <span className="material-symbols-outlined text-secondary">info</span>
          <span>Complete your active delivery to unlock the available queue.</span>
        </div>
      ) : null}

      {tab === 'available' && isPlatformAgent && !isLoading && !hasActiveDelivery ? (
        <div className="flex items-start gap-3 rounded-2xl bg-primary-container/15 px-4 py-3 text-sm text-on-surface">
          <span className="material-symbols-outlined text-primary">groups</span>
          <span className="flex-1">Same order for every platform agent — first to accept wins.</span>
          {isFetching ? (
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: tab === 'available' && isPlatformAgent ? 1 : 2 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-[1.75rem] bg-surface-container" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <DeliveryEmptyState
          icon={tab === 'available' ? 'inventory_2' : 'local_shipping'}
          title={tab === 'available' ? 'No orders waiting' : 'No active deliveries'}
          description={
            tab === 'available'
              ? hasActiveDelivery
                ? 'You already have an active delivery in progress.'
                : isPlatformAgent
                  ? 'The queue is empty right now. New orders will appear here automatically.'
                  : 'No store orders are ready for pickup yet.'
              : 'Accept an available order to start a delivery run.'
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <DeliveryOrderCard
              key={order.uuid}
              order={order}
              variant={tab}
              feeOnly={isPlatformAgent}
              highlighted={tab === 'available' && isPlatformAgent}
              disabled={
                accept.isPending ||
                deliver.isPending ||
                reached.isPending ||
                reachedPickup.isPending ||
                collectPackage.isPending
              }
              action={
                tab === 'available' ? (
                  <button
                    type="button"
                    disabled={accept.isPending}
                    onClick={() => accept.mutate(order.uuid)}
                    className={primaryCtaClassName()}
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    {accept.isPending ? 'Accepting…' : 'Accept delivery'}
                  </button>
                ) : order.status === 'ready_for_delivery' ? (
                  <button
                    type="button"
                    disabled={reachedPickup.isPending}
                    onClick={() => reachedPickup.mutate(order.uuid)}
                    className={primaryCtaClassName()}
                  >
                    <span className="material-symbols-outlined">storefront</span>
                    {reachedPickup.isPending ? 'Updating…' : 'Reached pickup'}
                  </button>
                ) : order.status === 'at_pickup' ? (
                  <button
                    type="button"
                    disabled={collectPackage.isPending}
                    onClick={() => collectPackage.mutate(order.uuid)}
                    className={primaryCtaClassName()}
                  >
                    <span className="material-symbols-outlined">inventory_2</span>
                    {collectPackage.isPending ? 'Updating…' : 'Package collected'}
                  </button>
                ) : order.status === 'picked_up' ? (
                  <button
                    type="button"
                    disabled={reached.isPending}
                    onClick={() => reached.mutate(order.uuid)}
                    className={primaryCtaClassName()}
                  >
                    <span className="material-symbols-outlined">location_on</span>
                    {reached.isPending ? 'Updating…' : 'Reached customer'}
                  </button>
                ) : order.status === 'out_for_delivery' ? (
                  <button
                    type="button"
                    disabled={deliver.isPending}
                    onClick={() => deliver.mutate(order.uuid)}
                    className={primaryCtaClassName('secondary')}
                  >
                    <span className="material-symbols-outlined">done_all</span>
                    {deliver.isPending ? 'Updating…' : 'Mark delivered'}
                  </button>
                ) : null
              }
            />
          ))}
        </div>
      )}

      {showPagination && meta && meta.last_page > 1 ? (
        <Pagination meta={meta} onPageChange={setPage} />
      ) : null}
    </DeliveryPageShell>
  )
}
