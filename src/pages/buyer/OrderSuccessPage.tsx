import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyerService, paymentService } from '@/api/services'
import type { OnlinePaymentMethod } from '@/constants/paymentMethods'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { ProductImage } from '@/components/buyer/ProductImage'
import { OrderRateForm } from '@/components/buyer/OrderRateForm'
import { OrderStatusHeroIcon } from '@/components/buyer/OrderStatusHeroIcon'
import { OrderSummaryCard } from '@/components/buyer/OrderSummaryCard'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { canBuyerCancelOrder, canTrackBuyerOrder, isActiveOrderStatus, isCancelledOrderStatus } from '@/utils/buyerAccount'
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

export function OrderSuccessPage() {
  const { orderUuid = '' } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const paymentOutcome = (location.state as { paymentOutcome?: string } | null)?.paymentOutcome
  const [hasRated, setHasRated] = useState(false)

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

  const actions = (
    <div className="mt-8 flex w-full flex-col gap-3 lg:mt-0 lg:flex-row lg:flex-wrap lg:justify-center">
      <Link
        to="/buyer/orders"
        className="flex h-12 items-center justify-center rounded-xl border-2 border-primary font-bold text-primary lg:min-w-[180px]"
      >
        All Orders
      </Link>
      {canCancel ? (
        <button
          type="button"
          disabled={cancelMutation.isPending}
          onClick={() => cancelMutation.mutate()}
          className="flex h-12 items-center justify-center rounded-xl border-2 border-error font-bold text-error disabled:opacity-50 lg:min-w-[180px]"
        >
          {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Order'}
        </button>
      ) : !active && !cancelled ? (
        <Link
          to={`/buyer/orders/${orderUuid}/invoice`}
          className="flex h-12 items-center justify-center rounded-xl border-2 border-outline font-bold text-on-surface-variant lg:min-w-[180px]"
        >
          View Invoice
        </Link>
      ) : null}
      <Link
        to="/buyer"
        className="flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-on-primary lg:min-w-[180px]"
      >
        Continue Shopping
      </Link>
    </div>
  )

  return (
    <div className="app-page-pad-bottom-cta lg:pb-8">
      <BuyerPageHeader title="Order" backTo="/buyer/orders" />
      <main className="app-page-pad-top buyer-page-container relative z-10 flex flex-grow flex-col items-center pb-8 lg:max-w-4xl lg:pt-8">
        <div className="mb-8 flex w-full flex-col items-center space-y-4 text-center">
          <OrderStatusHeroIcon active={active} delivered={delivered} cancelled={cancelled} />
          <h1 className="text-headline-xl text-primary">
            {cancelled
              ? 'Order Cancelled'
              : active
                ? tracking.status_label ?? 'Order In Progress'
                : 'Order Details'}
          </h1>
          <p className="text-body-lg px-4 text-on-surface-variant">
            {cancelled
              ? 'This order was cancelled. You can view the details below or place a new order.'
              : delivered && deliveryDurationLabel
              ? `Delivery completed in ${deliveryDurationLabel}`
              : active && liveTracking && tracking.eta_label
                ? tracking.eta_label
                : active
                  ? tracking.status_label ?? 'Your order is being processed.'
                  : 'Your order details and delivery information are below.'}
          </p>
          {active && tracking.delivery_agent_name ? (
            <p className="text-body-md text-on-surface-variant">
              Courier: {tracking.delivery_agent_name}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-rose-700">{getApiErrorMessage(error, 'Could not load order')}</p>
        ) : isLoading ? (
          <div className="h-40 w-full animate-pulse rounded-xl bg-surface-container" />
        ) : order ? (
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
            {needsOnlinePayment ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 lg:col-span-12">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">Payment pending</p>
                    <p className="text-body-md">
                      {paymentOutcome === 'failed'
                        ? 'Your last payment attempt failed.'
                        : 'Complete payment to confirm your order.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={retryPaymentMutation.isPending}
                    onClick={() => retryPaymentMutation.mutate()}
                    className="rounded-xl bg-primary px-4 py-2 font-bold text-on-primary disabled:opacity-60"
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
            <div className="flex flex-col gap-4 lg:col-span-7 lg:gap-6">
              <div className="rounded-xl border border-primary/5 bg-surface-container-low p-4 shadow-sm lg:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary-fixed p-2 text-on-primary-fixed">
                      <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    <div className="text-left">
                      <p className="text-label-md uppercase text-primary">Current Status</p>
                      <p className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">
                        {tracking.status_label ?? formatOrderStatusLabel(currentStatus)}
                      </p>
                      {active && liveTracking && tracking.eta_label ? (
                        <p className="text-body-md mt-1 text-on-surface-variant">{tracking.eta_label}</p>
                      ) : null}
                      {delivered && deliveryDurationLabel ? (
                        <p className="text-body-md mt-1 text-on-surface-variant">
                          Delivery completed in {deliveryDurationLabel}
                        </p>
                      ) : null}
                      {tracking.delivery_agent_name ? (
                        <p className="text-body-md mt-1 text-on-surface-variant">
                          Courier: {tracking.delivery_agent_name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {active ? (
                    <span className="hidden rounded-full bg-secondary-fixed px-3 py-1 text-label-md text-on-secondary-fixed lg:inline">
                      {(tracking.status_label ?? formatOrderStatusLabel(currentStatus)).toUpperCase()}
                    </span>
                  ) : null}
                </div>
                {timeline.length > 0 ? (
                  <div className="space-y-3 border-t border-outline-variant/30 pt-4">
                    {timeline.map((entry, index) => (
                      <div key={`${entry.status}-${entry.at}-${index}`} className="flex items-start gap-3 text-left">
                        <span
                          className={cn(
                            'mt-1 h-2.5 w-2.5 rounded-full',
                            index === timeline.length - 1 ? 'bg-primary' : 'bg-outline-variant',
                          )}
                        />
                        <div>
                          <p className="text-body-md font-semibold text-on-surface">
                            {formatOrderStatusLabel(String(entry.status))}
                          </p>
                          <p className="text-label-md text-on-surface-variant">
                            {formatTimelineDate(entry.at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="hidden h-2 w-full overflow-hidden rounded-full bg-surface-container-highest lg:block">
                    <div className="h-full w-2/3 bg-primary" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-surface-variant/30 bg-surface-container-lowest p-4 shadow-sm lg:gap-6 lg:bg-surface lg:p-6">
                <div className="grid grid-cols-2 gap-4 border-b border-outline-variant pb-4 lg:gap-6 lg:pb-6">
                  <div className="text-left">
                    <p className="text-label-md mb-1 text-outline uppercase">Order ID</p>
                    <p className="text-body-lg font-bold text-on-surface">
                      #{order.order_number ?? order.uuid.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-label-md mb-1 text-outline uppercase">Items</p>
                    <p className="text-body-lg font-bold text-on-surface">{items.length} Items</p>
                  </div>
                  {delivered && deliveryDurationLabel ? (
                    <div className="col-span-2 text-left">
                      <p className="text-label-md mb-1 text-outline uppercase">Delivery Duration</p>
                      <p className="text-body-lg font-bold text-on-surface">{deliveryDurationLabel}</p>
                    </div>
                  ) : null}
                </div>

                {order.address ? (
                  <div className="flex gap-4 text-left">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      location_on
                    </span>
                    <div>
                      <p className="text-label-md mb-1 text-outline uppercase">Delivery Address</p>
                      <p className="text-body-md leading-relaxed text-on-surface">
                        {[order.address.label, addressLine, order.address.city, order.address.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {items.length > 0 ? (
              <div className="lg:col-span-5">
                <div className="rounded-xl border border-surface-variant/30 bg-surface-container-lowest p-4 shadow-sm lg:sticky lg:top-28 lg:border-outline-variant/30 lg:bg-surface lg:p-6">
                  <p className="text-label-md mb-4 text-outline uppercase lg:text-headline-lg lg:normal-case lg:text-on-surface">
                    Order Summary
                  </p>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={`${item.product?.uuid ?? item.product_name ?? index}`} className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container lg:h-16 lg:w-16">
                          <ProductImage product={item.product} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-body-md font-semibold text-on-surface lg:text-body-lg">
                            {item.product?.name ?? item.product_name}
                          </p>
                          <p className="text-label-md text-on-surface-variant">× {item.quantity}</p>
                        </div>
                        <p className="text-price-display text-on-surface">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-dashed border-outline-variant/30 pt-3 lg:mt-6 lg:pt-4">
                    <OrderSummaryCard
                      subtotal={Number(order.subtotal ?? 0)}
                      delivery={Number(order.delivery_charge ?? 0)}
                      platformFee={Number(order.platform_fee ?? 0)}
                      discount={Number(order.discount ?? 0)}
                      total={Number(order.total ?? 0)}
                      itemCount={items.length}
                      couponCode={typeof order.coupon_code === 'string' ? order.coupon_code : undefined}
                      title=""
                      className="[&_h3]:hidden"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {!active && currentStatus.toLowerCase() === 'delivered' && !hasRated ? (
              <div className="lg:col-span-12">
                <OrderRateForm orderUuid={orderUuid} onRated={() => setHasRated(true)} />
              </div>
            ) : null}
          </div>
        ) : null}

        {cancelMutation.isError ? (
          <p className="mt-4 text-sm text-rose-700">
            {getApiErrorMessage(cancelMutation.error, 'Could not cancel order')}
          </p>
        ) : null}

        <div className="w-full lg:mt-10">{actions}</div>
      </main>
    </div>
  )
}
