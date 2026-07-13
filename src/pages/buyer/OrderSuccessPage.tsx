import { Link, useLocation, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyerService, paymentService } from '@/api/services'
import type { OnlinePaymentMethod } from '@/constants/paymentMethods'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { ProductImage } from '@/components/buyer/ProductImage'
import { OrderRateForm } from '@/components/buyer/OrderRateForm'
import { DeliveryRateForm } from '@/components/buyer/DeliveryRateForm'
import { OrderStatusHeroIcon } from '@/components/buyer/OrderStatusHeroIcon'
import { OrderSummaryCard } from '@/components/buyer/OrderSummaryCard'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import {
  canBuyerCancelOrder,
  canTrackBuyerOrder,
  isActiveOrderStatus,
  isCancelledOrderStatus,
} from '@/utils/buyerAccount'
import { formatOrderStatusLabel, resolveOrderTracking } from '@/utils/orderTracking'
import { openPaymentGateway } from '@/utils/paymentCheckout'
import { cn } from '@/utils/cn'

function formatTimelineDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const softCard =
  'rounded-2xl bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:p-5 lg:shadow-none'

export function OrderSuccessPage() {
  const { orderUuid = '' } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const paymentOutcome = (location.state as { paymentOutcome?: string } | null)?.paymentOutcome

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'order', orderUuid],
    queryFn: () => buyerService.getOrder(orderUuid),
    enabled: !!orderUuid,
  })

  const order = data?.data

  const { data: trackData } = useQuery({
    queryKey: ['buyer', 'order', orderUuid, 'track'],
    queryFn: () => buyerService.trackOrder(orderUuid),
    enabled: !!orderUuid,
    refetchInterval: (query) => {
      const status = String(
        query.state.data?.data?.current_status ?? order?.status ?? '',
      ).toLowerCase()
      return isActiveOrderStatus(status) ? 15_000 : false
    },
  })

  const tracking = resolveOrderTracking(order, trackData?.data)
  const currentStatus = tracking.current_status ?? trackData?.data?.current_status ?? order?.status ?? ''

  const cancelMutation = useMutation({
    mutationFn: () => buyerService.cancelOrder(orderUuid, 'Cancelled by buyer'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', 'order', orderUuid] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'orders'] })
    },
  })

  const retryPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!order?.uuid || !order.payment_method || order.payment_method === 'cod') {
        throw new Error('Online payment is not available for this order')
      }

      const payRes = await paymentService.initiatePayment({
        order_uuid: order.uuid,
        payment_method: order.payment_method as OnlinePaymentMethod,
      })
      const initiate = payRes.data
      if (!initiate?.payment_uuid || !initiate.gateway) {
        throw new Error('Payment could not be initiated')
      }

      const checkoutResult = await openPaymentGateway({
        initiate,
        paymentMethod: order.payment_method as OnlinePaymentMethod,
        user,
      })

      if (checkoutResult !== 'paid') {
        throw new Error(
          checkoutResult === 'failed' ? 'Payment failed. Please try again.' : 'Payment was not completed.',
        )
      }

      await paymentService.verifyPayment({
        payment_uuid: initiate.payment_uuid,
        gateway: initiate.gateway,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', 'order', orderUuid] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'orders'] })
    },
  })

  const items = order?.items ?? []
  const timeline = trackData?.data?.timeline ?? []
  const active = isActiveOrderStatus(currentStatus)
  const cancelled = isCancelledOrderStatus(currentStatus)
  const liveTracking = canTrackBuyerOrder({ status: currentStatus, tracking })
  const delivered = currentStatus.toLowerCase() === 'delivered'
  const deliveryDurationLabel =
    trackData?.data?.delivery_completed_duration_label ??
    (typeof order?.tracking?.delivery_completed_duration_label === 'string'
      ? order.tracking.delivery_completed_duration_label
      : undefined)
  const canCancel = canBuyerCancelOrder(order, tracking)
  const addressLine = order?.address?.address_line ?? order?.address?.line1
  const needsOnlinePayment =
    order?.payment_method &&
    order.payment_method !== 'cod' &&
    order.payment_status !== 'paid'

  const statusTitle = cancelled
    ? 'Order Cancelled'
    : active
      ? tracking.status_label ?? 'Order In Progress'
      : delivered
        ? 'Delivered'
        : 'Order Details'

  const statusSubtitle = cancelled
    ? 'This order was cancelled.'
    : delivered && deliveryDurationLabel
      ? `Completed in ${deliveryDurationLabel}`
      : active && liveTracking && tracking.eta_label
        ? tracking.eta_label
        : active
          ? tracking.status_label ?? 'Your order is being processed.'
          : 'Order details and delivery info'

  const headerTitle = order?.order_number
    ? `#${order.order_number}`
    : order
      ? `#${order.uuid.slice(0, 8).toUpperCase()}`
      : 'Order'

  return (
    <div className="app-page-pad-bottom-cta pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      <BuyerPageHeader
        title={headerTitle}
        backTo="/buyer/orders"
        right={
          !active && !cancelled && orderUuid ? (
            <Link
              to={`/buyer/orders/${orderUuid}/invoice`}
              className="flex h-10 items-center gap-1 rounded-full px-2.5 text-sm font-bold text-primary"
            >
              <span className="material-symbols-outlined text-[20px]">receipt</span>
              <span className="sr-only sm:not-sr-only">Invoice</span>
            </Link>
          ) : null
        }
      />

      <main className="app-page-pad-top buyer-page-container relative z-10 mx-auto w-full max-w-lg lg:max-w-4xl lg:pt-8">
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {getApiErrorMessage(error, 'Could not load order')}
          </p>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-36 animate-pulse rounded-2xl bg-surface-container" />
            <div className="h-28 animate-pulse rounded-2xl bg-surface-container" />
            <div className="h-48 animate-pulse rounded-2xl bg-surface-container" />
          </div>
        ) : order ? (
          <div className="space-y-3 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0">
            {/* Status hero */}
            <section className={cn(softCard, 'text-center lg:col-span-12 lg:flex lg:items-center lg:gap-6 lg:text-left')}>
              <div className="mx-auto w-fit shrink-0 lg:mx-0 [&_.order-status-hero]:mb-0 [&_.order-status-hero]:h-20 [&_.order-status-hero]:w-20 lg:[&_.order-status-hero]:h-24 lg:[&_.order-status-hero]:w-24">
                <OrderStatusHeroIcon active={active} delivered={delivered} cancelled={cancelled} />
              </div>
              <div className="mt-3 min-w-0 lg:mt-0 lg:flex-1">
                <p className="text-[11px] font-bold tracking-wide text-outline uppercase lg:text-label-md">
                  {active ? 'Live status' : 'Status'}
                </p>
                <h1 className="mt-0.5 text-xl font-bold text-primary lg:text-headline-xl">{statusTitle}</h1>
                <p className="mt-1 text-sm text-on-surface-variant lg:text-body-lg">{statusSubtitle}</p>
                {tracking.delivery_agent_name ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface">
                    <span className="material-symbols-outlined text-[16px]">delivery_dining</span>
                    {tracking.delivery_agent_name}
                  </p>
                ) : null}
              </div>
              {active && liveTracking ? (
                <div className="mt-3 hidden shrink-0 items-center gap-1 rounded-full bg-primary-container/15 px-3 py-1.5 text-xs font-bold text-primary lg:mt-0 lg:flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  Tracking
                </div>
              ) : null}
            </section>

            {needsOnlinePayment ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 shadow-[0_2px_12px_rgba(15,40,20,0.04)] lg:col-span-12 lg:rounded-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold">Payment pending</p>
                    <p className="mt-0.5 text-amber-900/80">
                      {paymentOutcome === 'failed'
                        ? 'Your last payment attempt failed.'
                        : 'Complete payment to confirm your order.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={retryPaymentMutation.isPending}
                    onClick={() => retryPaymentMutation.mutate()}
                    className="h-11 rounded-xl bg-primary px-5 font-bold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {retryPaymentMutation.isPending ? 'Opening checkout…' : 'Pay Now'}
                  </button>
                </div>
                {retryPaymentMutation.isError ? (
                  <p className="mt-2 text-error">
                    {getApiErrorMessage(retryPaymentMutation.error, 'Payment retry failed')}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3 lg:col-span-7 lg:space-y-4">
              {/* Timeline */}
              <section className={softCard}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">timeline</span>
                  <h2 className="text-[15px] font-bold text-on-surface lg:text-base">Order timeline</h2>
                </div>
                {timeline.length > 0 ? (
                  <ol className="relative space-y-0 pl-1">
                    {timeline.map((entry, index) => {
                      const isLatest = index === timeline.length - 1
                      return (
                        <li key={`${entry.status}-${entry.at}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                          {index < timeline.length - 1 ? (
                            <span className="absolute top-3 left-[7px] h-[calc(100%-6px)] w-px bg-outline-variant/60" />
                          ) : null}
                          <span
                            className={cn(
                              'relative z-[1] mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2',
                              isLatest
                                ? 'border-primary bg-primary ring-4 ring-primary/15'
                                : 'border-outline-variant bg-surface-container-lowest',
                            )}
                          />
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p
                              className={cn(
                                'text-sm font-semibold',
                                isLatest ? 'text-primary' : 'text-on-surface',
                              )}
                            >
                              {formatOrderStatusLabel(String(entry.status))}
                            </p>
                            <p className="text-xs text-on-surface-variant">{formatTimelineDate(entry.at)}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-surface-container-low/80 px-3 py-3">
                    <span className="material-symbols-outlined text-primary">
                      {cancelled ? 'cancel' : active ? 'hourglass_top' : 'check_circle'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {tracking.status_label ?? formatOrderStatusLabel(currentStatus)}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {active ? 'Updates will appear here as the order moves.' : 'No timeline events yet.'}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Meta + address */}
              <section className={softCard}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface-container-low/80 px-3 py-2.5">
                    <p className="text-[10px] font-bold tracking-wide text-outline uppercase">Order ID</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-on-surface">
                      #{order.order_number ?? order.uuid.slice(0, 8)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low/80 px-3 py-2.5">
                    <p className="text-[10px] font-bold tracking-wide text-outline uppercase">Items</p>
                    <p className="mt-0.5 text-sm font-bold text-on-surface">
                      {items.length} item{items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  {delivered && deliveryDurationLabel ? (
                    <div className="col-span-2 rounded-xl bg-surface-container-low/80 px-3 py-2.5">
                      <p className="text-[10px] font-bold tracking-wide text-outline uppercase">
                        Delivery duration
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-on-surface">{deliveryDurationLabel}</p>
                    </div>
                  ) : null}
                </div>

                {order.address ? (
                  <div className="mt-3 flex gap-3 border-t border-outline-variant/40 pt-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        location_on
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-wide text-outline uppercase">
                        Delivery address
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-on-surface">
                        {[order.address.label, addressLine, order.address.city, order.address.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>

            {/* Items + totals */}
            <div className="space-y-3 lg:col-span-5 lg:space-y-4">
              {items.length > 0 ? (
                <section className={cn(softCard, 'lg:sticky lg:top-28')}>
                  <h2 className="mb-3 text-[15px] font-bold text-on-surface lg:text-base">Items</h2>
                  <div className="space-y-2.5">
                    {items.map((item, index) => (
                      <div
                        key={`${item.product?.uuid ?? item.product_name ?? index}`}
                        className="flex items-center gap-3 rounded-xl bg-surface-container-low/60 p-2 pr-3"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                          <ProductImage product={item.product} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-on-surface">
                            {item.product?.name ?? item.product_name}
                          </p>
                          <p className="text-xs text-on-surface-variant">Qty {item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-on-surface">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-dashed border-outline-variant/40 pt-3">
                    <OrderSummaryCard
                      subtotal={Number(order.subtotal ?? 0)}
                      delivery={Number(order.delivery_charge ?? 0)}
                      platformFee={Number(order.platform_fee ?? 0)}
                      discount={Number(order.discount ?? 0)}
                      total={Number(order.total ?? 0)}
                      itemCount={items.length}
                      couponCode={typeof order.coupon_code === 'string' ? order.coupon_code : undefined}
                      title=""
                      className="[&_h3]:hidden [&_.space-y-4]:space-y-2.5"
                    />
                  </div>
                </section>
              ) : null}

              {!active && delivered ? (
                <div className="space-y-3">
                  <OrderRateForm
                    orderUuid={orderUuid}
                    products={items
                      .filter((item) => item.can_rate && item.product?.uuid)
                      .map((item) => ({
                        productUuid: item.product!.uuid,
                        productName: item.product?.name ?? item.product_name,
                        initialRating: item.buyer_rating?.rating,
                      }))}
                  />
                  {order.can_rate_delivery ? (
                    <DeliveryRateForm
                      orderUuid={orderUuid}
                      riderName={
                        order.delivery_agent?.name ??
                        tracking.delivery_agent_name ??
                        null
                      }
                      initialRating={order.delivery_rating?.rating}
                      initialComment={order.delivery_rating?.comment}
                    />
                  ) : null}
                </div>
              ) : null}

              {/* Desktop actions */}
              <div className="hidden flex-col gap-2 lg:flex">
                {canCancel ? (
                  <button
                    type="button"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate()}
                    className="flex h-11 items-center justify-center rounded-xl border border-error font-bold text-error disabled:opacity-50"
                  >
                    {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                ) : null}
                {!active && !cancelled ? (
                  <Link
                    to={`/buyer/orders/${orderUuid}/invoice`}
                    className="flex h-11 items-center justify-center rounded-xl border border-outline-variant font-bold text-on-surface-variant"
                  >
                    View Invoice
                  </Link>
                ) : null}
                <Link
                  to="/buyer"
                  className="flex h-11 items-center justify-center rounded-xl bg-primary font-bold text-on-primary"
                >
                  Continue Shopping
                </Link>
                <Link
                  to="/buyer/orders"
                  className="flex h-11 items-center justify-center rounded-xl text-sm font-bold text-primary"
                >
                  All Orders
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {cancelMutation.isError ? (
          <p className="mt-3 text-sm text-rose-700">
            {getApiErrorMessage(cancelMutation.error, 'Could not cancel order')}
          </p>
        ) : null}
      </main>

      {/* Mobile sticky CTA */}
      {order ? (
        <div className="app-cta-safe fixed right-0 bottom-0 left-0 z-30 border-t border-outline-variant/40 bg-surface/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            {canCancel ? (
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-error text-sm font-bold text-error disabled:opacity-50"
              >
                {cancelMutation.isPending ? '…' : 'Cancel'}
              </button>
            ) : (
              <Link
                to="/buyer/orders"
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-outline-variant text-sm font-bold text-on-surface-variant"
              >
                All Orders
              </Link>
            )}
            <Link
              to="/buyer"
              className="flex h-12 flex-[1.4] items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
