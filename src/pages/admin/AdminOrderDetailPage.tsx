import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ADMIN_ORDER_STATUSES,
  getOrder,
  refundOrder,
  updateOrderStatus,
  type AdminOrder,
} from '@/api/services/adminOrdersService'
import { ProductImage } from '@/components/buyer/ProductImage'
import { OrderSummaryCard } from '@/components/buyer/OrderSummaryCard'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'
import { formatOrderStatusLabel } from '@/utils/orderTracking'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-label-md text-on-surface-variant">{label}</p>
      <p className="text-body-md font-medium text-on-surface">{value}</p>
    </div>
  )
}

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 stitch-card-shadow', className)}>
      <h2 className="text-headline-lg mb-4 border-b border-outline-variant/20 pb-3 text-on-surface">{title}</h2>
      {children}
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-label-md font-semibold capitalize',
        key === 'delivered' && 'bg-primary-container/20 text-primary',
        key === 'cancelled' && 'bg-error-container text-error',
        key !== 'delivered' && key !== 'cancelled' && 'bg-surface-container-high text-on-surface-variant',
      )}
    >
      {formatOrderStatusLabel(status)}
    </span>
  )
}

export function AdminOrderDetailPage() {
  const { uuid = '' } = useParams()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'orders', uuid],
    queryFn: () => getOrder(uuid),
    enabled: Boolean(uuid),
  })

  const updateStatus = useMutation({
    mutationFn: (status: string) => updateOrderStatus(uuid, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'orders', uuid] }),
  })

  const refund = useMutation({
    mutationFn: () => refundOrder(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'orders', uuid] }),
  })

  const order = data?.data as AdminOrder | undefined
  const items = order?.items ?? []
  const timeline = order?.timeline ?? []
  const refunds = order?.refunds ?? []
  const settlements = order?.settlements ?? []
  const addressParts = [
    order?.address?.label,
    order?.address?.address_line,
    order?.address?.city,
    order?.address?.pincode,
  ].filter(Boolean)

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link to="/admin/orders" className="text-label-md inline-flex items-center gap-1 font-bold text-primary hover:underline">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to orders
      </Link>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-surface-container" />
      ) : null}

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-body-md text-error">
          {getApiErrorMessage(error, 'Failed to load order')}
        </p>
      ) : null}

      {order ? (
        <>
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-label-md font-bold text-primary">ORDER #{order.order_number ?? order.uuid.slice(0, 8)}</p>
              <h1 className="text-headline-xl text-on-surface">Order details</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="text-body-md text-on-surface-variant">
                  Placed {formatOrderDateTime(order.created_at)}
                </span>
                {order.updated_at ? (
                  <span className="text-body-md text-on-surface-variant">
                    · Updated {formatOrderDateTime(order.updated_at)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <p className="text-label-md text-on-surface-variant">Order total</p>
              <p className="text-headline-xl text-on-surface">{formatCurrency(order.total)}</p>
            </div>
          </header>

          <SectionCard title="Admin actions">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="block flex-1">
                <span className="text-label-md text-on-surface-variant">Update status</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select
                    defaultValue={order.status}
                    onChange={(e) => updateStatus.mutate(e.target.value)}
                    disabled={updateStatus.isPending}
                    className="min-w-[200px] rounded-xl border border-outline px-4 py-2.5 text-body-md"
                  >
                    {ADMIN_ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatOrderStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <button
                type="button"
                disabled={refund.isPending || order.payment_status === 'refunded' || order.status === 'cancelled'}
                onClick={() => refund.mutate()}
                className="rounded-xl bg-error px-5 py-2.5 font-semibold text-on-error disabled:opacity-50"
              >
                {refund.isPending ? 'Processing…' : 'Issue refund & cancel'}
              </button>
            </div>
            {(updateStatus.isError || refund.isError) && (
              <p className="mt-3 text-body-md text-error">
                {getApiErrorMessage(updateStatus.error ?? refund.error, 'Action failed')}
              </p>
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard title="Buyer">
              <div className="space-y-3">
                <DetailRow label="Name" value={order.buyer?.name} />
                <DetailRow label="Phone" value={order.buyer?.phone} />
                <DetailRow label="Email" value={order.buyer?.email} />
                <DetailRow label="UUID" value={order.buyer?.uuid} />
              </div>
            </SectionCard>

            <SectionCard title="Seller">
              <div className="space-y-3">
                <DetailRow label="Store" value={order.seller?.store_name ?? order.seller?.name} />
                <DetailRow label="Phone" value={order.seller?.phone} />
                <DetailRow label="City" value={order.seller?.city} />
                <DetailRow label="UUID" value={order.seller?.uuid} />
              </div>
            </SectionCard>

            <SectionCard title="Delivery agent">
              {order.delivery_agent ? (
                <div className="space-y-3">
                  <DetailRow label="Name" value={order.delivery_agent.name} />
                  <DetailRow label="Phone" value={order.delivery_agent.phone} />
                  <DetailRow label="Email" value={order.delivery_agent.email} />
                  <DetailRow label="UUID" value={order.delivery_agent.uuid} />
                </div>
              ) : (
                <p className="text-body-md text-on-surface-variant">No agent assigned yet.</p>
              )}
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <SectionCard title={`Order items (${items.length})`}>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={`${item.product_name}-${index}`}
                      className="flex items-center gap-4 rounded-xl border border-outline-variant/30 p-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                        <ProductImage
                          src={item.product?.image_url}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-md font-semibold text-on-surface">{item.product_name}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {item.product_unit ?? item.product?.unit ?? '—'} · Qty {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-body-md font-semibold text-on-surface">{formatCurrency(item.subtotal)}</p>
                        <p className="text-body-sm text-on-surface-variant">{formatCurrency(item.unit_price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Status timeline">
                {timeline.length > 0 ? (
                  <div className="space-y-4">
                    {timeline.map((entry, index) => (
                      <div key={`${entry.status}-${entry.at}-${index}`} className="flex gap-3">
                        <span
                          className={cn(
                            'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                            index === timeline.length - 1 ? 'bg-primary' : 'bg-outline-variant',
                          )}
                        />
                        <div>
                          <p className="text-body-md font-semibold text-on-surface">
                            {formatOrderStatusLabel(entry.status)}
                          </p>
                          <p className="text-body-sm text-on-surface-variant">{formatOrderDateTime(entry.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-md text-on-surface-variant">No status history recorded.</p>
                )}
              </SectionCard>

              {(refunds.length > 0 || settlements.length > 0) && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {refunds.length > 0 ? (
                    <SectionCard title="Refunds">
                      <div className="space-y-3">
                        {refunds.map((refundRow) => (
                          <div key={refundRow.uuid} className="rounded-lg bg-surface-container-low p-3">
                            <p className="text-body-md font-semibold text-on-surface">{formatCurrency(refundRow.amount)}</p>
                            <p className="text-body-sm capitalize text-on-surface-variant">{refundRow.status}</p>
                            {refundRow.reason ? (
                              <p className="text-body-sm text-on-surface-variant">{refundRow.reason}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}

                  {settlements.length > 0 ? (
                    <SectionCard title="Payout settlements">
                      <div className="space-y-3">
                        {settlements.map((row, index) => (
                          <div key={`${row.payout_uuid}-${index}`} className="rounded-lg bg-surface-container-low p-3">
                            <p className="text-body-md font-semibold text-on-surface">
                              {formatCurrency(row.amount)} · {row.payee_type?.replace(/_/g, ' ')}
                            </p>
                            <p className="text-body-sm text-on-surface-variant">{row.description}</p>
                            <p className="text-body-sm text-on-surface-variant">
                              Payout: {row.payout_reference ?? row.payout_uuid ?? '—'} ({row.payout_status})
                            </p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-6 lg:col-span-4">
              <SectionCard title="Delivery address">
                <p className="text-body-md leading-relaxed text-on-surface">{addressParts.join(', ') || '—'}</p>
                {order.address?.latitude != null && order.address?.longitude != null ? (
                  <p className="text-body-sm mt-2 text-on-surface-variant">
                    {order.address.latitude}, {order.address.longitude}
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <DetailRow label="Delivery type" value={order.delivery_type?.replace(/_/g, ' ')} />
                  <DetailRow
                    label="Distance"
                    value={order.distance_km != null ? `${order.distance_km} km` : undefined}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Payment">
                <div className="space-y-3">
                  <DetailRow label="Method" value={order.payment_method?.replace(/_/g, ' ')} />
                  <DetailRow label="Payment status" value={order.payment_status} />
                  {order.payment ? (
                    <>
                      <DetailRow label="Gateway" value={order.payment.gateway ?? undefined} />
                      <DetailRow label="Gateway order ID" value={order.payment.gateway_order_id ?? undefined} />
                      <DetailRow label="Gateway payment ID" value={order.payment.gateway_payment_id ?? undefined} />
                      <DetailRow label="Paid amount" value={formatCurrency(order.payment.amount)} />
                    </>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard title="Financial summary">
                <OrderSummaryCard
                  subtotal={Number(order.subtotal ?? 0)}
                  delivery={Number(order.delivery_charge ?? 0)}
                  platformFee={Number(order.platform_fee ?? 0)}
                  discount={Number(order.discount ?? 0)}
                  total={Number(order.total ?? 0)}
                  itemCount={items.length}
                  couponCode={order.coupon_code}
                  title=""
                  className="[&_h3]:hidden"
                />
                {(order.delivery_base_charge != null ||
                  order.delivery_distance_charge != null ||
                  order.delivery_rain_surcharge != null) && (
                  <div className="mt-4 space-y-2 border-t border-dashed border-outline-variant/40 pt-4 text-body-sm text-on-surface-variant">
                    <p>Delivery base: {formatCurrency(order.delivery_base_charge ?? 0)}</p>
                    <p>Distance charge: {formatCurrency(order.delivery_distance_charge ?? 0)}</p>
                    <p>Rain surcharge: {formatCurrency(order.delivery_rain_surcharge ?? 0)}</p>
                  </div>
                )}
              </SectionCard>

              {(order.notes || order.coupon_code || order.invoice_url) && (
                <SectionCard title="Other">
                  <div className="space-y-3">
                    <DetailRow label="Coupon" value={order.coupon_code} />
                    <DetailRow label="Buyer notes" value={order.notes} />
                    {order.invoice_url ? (
                      <div>
                        <p className="text-label-md text-on-surface-variant">Invoice</p>
                        <a
                          href={order.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-body-md font-medium text-primary hover:underline"
                        >
                          View invoice
                        </a>
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
