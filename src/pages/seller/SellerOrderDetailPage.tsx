import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import { BreadcrumbBackLink } from '@/components/common/BreadcrumbBack'
import { ProductImage } from '@/components/buyer/ProductImage'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'
import { sellerOrderLabel, sellerOrderStatusConfig } from '@/utils/sellerOrderStatus'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

export function SellerOrderDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'orders', uuid],
    queryFn: () => sellerService.getOrder(uuid!),
    enabled: Boolean(uuid),
  })

  const order = data?.data
  const status = sellerOrderStatusConfig(order?.status)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] })
    queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] })
  }

  const updateStatus = useMutation({
    mutationFn: (nextStatus: string) => sellerService.updateOrderStatus(uuid!, nextStatus),
    onSuccess: invalidate,
  })

  const rejectOrder = useMutation({
    mutationFn: () => sellerService.rejectOrder(uuid!),
    onSuccess: () => {
      invalidate()
      navigate('/seller/orders')
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-8">
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load order')}
        </p>
        <BreadcrumbBackLink backTo="/seller/orders" label="Back to Orders" className="mt-4" />
      </div>
    )
  }

  const items = order.items ?? []
  const addressLine = [order.address?.address_line, order.address?.city, order.address?.pincode]
    .filter(Boolean)
    .join(', ')

  const nextReadyStatus =
    order.status === 'accepted' || order.status === 'preparing' || order.status === 'packed'
      ? 'ready_for_delivery'
      : null

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <nav className="mb-6">
        <BreadcrumbBackLink backTo="/seller/orders" label="Back to Orders" />
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-lowest p-6 stitch-card-shadow md:flex-row md:items-center">
            <div>
              <p className="mb-1 text-label-md font-bold text-primary-container">
                ORDER ID: {sellerOrderLabel(order.order_number, order.uuid)}
              </p>
              <h2 className="mb-2 text-headline-xl text-on-surface">{order.buyer?.name ?? 'Customer'}</h2>
              <div className="flex items-center text-body-md text-on-surface-variant">
                <span className="material-symbols-outlined mr-2 text-body-md">calendar_today</span>
                {formatOrderDateTime(order.created_at)}
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-label-md font-bold', status.badgeClass)}>
                <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                {status.label}
              </span>
              <div className="flex flex-wrap gap-2">
                {order.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate('accepted')}
                      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-label-md text-on-primary hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Accept Order
                    </button>
                    <button
                      type="button"
                      disabled={rejectOrder.isPending}
                      onClick={() => rejectOrder.mutate()}
                      className="flex items-center gap-2 rounded-xl border border-error px-4 py-2 text-label-md text-error hover:bg-error/5"
                    >
                      Decline
                    </button>
                  </>
                ) : null}
                {nextReadyStatus ? (
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate(nextReadyStatus)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-label-md text-on-primary hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Mark as Ready
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container-lowest p-6 stitch-card-shadow">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-headline-lg">Order Items</h3>
              <span className="text-body-md text-on-surface-variant">{items.length} Items Total</span>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product_name}-${item.quantity}-${item.unit_price}`}
                  className="group flex items-center gap-4 rounded-xl border border-surface-variant p-4 transition-colors hover:border-primary-fixed-dim"
                >
                  <ProductImage
                    src={item.product?.image_url}
                    alt={item.product_name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="text-body-lg font-bold">{item.product_name}</h4>
                    <p className="text-body-md text-on-surface-variant">
                      Unit: {item.product_unit ?? item.product?.unit ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-price-display">{formatCurrency(item.unit_price)}</p>
                    <p className="text-label-md text-on-surface-variant">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl bg-surface-container-lowest p-6 stitch-card-shadow">
            <h3 className="mb-4 border-b border-surface-variant pb-2 text-label-md tracking-widest text-on-surface-variant uppercase">
              Customer Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined rounded-lg bg-primary-container/10 p-2 text-primary">person</span>
                <div>
                  <p className="text-label-md text-on-surface-variant">Name</p>
                  <p className="text-body-md font-bold">{order.buyer?.name ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined rounded-lg bg-primary-container/10 p-2 text-primary">call</span>
                <div>
                  <p className="text-label-md text-on-surface-variant">Phone Number</p>
                  <p className="text-body-md font-bold">{order.buyer?.phone ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined rounded-lg bg-primary-container/10 p-2 text-primary">
                  local_shipping
                </span>
                <div>
                  <p className="text-label-md text-on-surface-variant">Delivery Address</p>
                  <p className="text-body-md font-bold">{addressLine || '—'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary-container shadow-lg">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <span className="material-symbols-outlined text-[160px]">shopping_basket</span>
            </div>
            <h3 className="relative z-10 mb-4 border-b border-on-primary-container/20 pb-2 text-label-md tracking-widest uppercase">
              Order Summary
            </h3>
            <div className="relative z-10 space-y-2">
              <div className="flex justify-between text-body-md">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-body-md">
                <span>Delivery Fee</span>
                <span>{formatCurrency(order.delivery_charge)}</span>
              </div>
              {(order.platform_fee ?? 0) > 0 ? (
                <div className="flex justify-between text-body-md">
                  <span>Platform Fee</span>
                  <span>{formatCurrency(order.platform_fee)}</span>
                </div>
              ) : null}
              {(order.discount ?? 0) > 0 ? (
                <div className="flex justify-between text-body-md">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              <div className="mt-4 flex justify-between border-t border-on-primary-container/20 pt-4">
                <span className="text-headline-lg">Total Amount</span>
                <span className="text-headline-lg">{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div className="relative z-10 mt-6 flex items-center gap-2 rounded-lg bg-on-primary-container/10 p-3 text-label-md">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>
                {order.payment_status ?? 'Payment'} via {order.payment_method ?? '—'}
              </span>
            </div>
          </section>

          {order.notes ? (
            <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-high/30 p-4">
              <p className="mb-1 text-label-md font-bold text-on-surface-variant">Internal Notes</p>
              <p className="text-body-md text-on-surface-variant italic">&quot;{order.notes}&quot;</p>
            </section>
          ) : null}
        </div>
      </div>

      {updateStatus.error || rejectOrder.error ? (
        <p className="mt-6 text-sm text-error">
          {getApiErrorMessage(updateStatus.error ?? rejectOrder.error, 'Action failed')}
        </p>
      ) : null}
    </div>
  )
}
