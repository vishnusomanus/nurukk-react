import type { DeliveryHistoryOrder, DeliveryOrder } from '@/api/services/deliveryService'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'
import { buildGoogleMapsUrl, buildTelUrl } from '@/utils/googleMaps'
import { formatOrderStatusLabel } from '@/utils/orderTracking'
import { cn } from '@/utils/cn'

export type { DeliveryOrder } from '@/api/services/deliveryService'

type ContactStage = 'available' | 'pickup' | 'post_pickup' | 'delivery' | 'complete'

function formatAddressLine(parts: Array<string | undefined | null>) {
  const value = parts.filter(Boolean).join(', ')
  return value || 'Address not available'
}

function formatDropoffAddress(order: DeliveryOrder) {
  return formatAddressLine([order.address?.address_line, order.address?.city, order.address?.pincode])
}

function formatPickupAddress(order: DeliveryOrder) {
  return formatAddressLine([order.seller?.address_line, order.seller?.city, order.seller?.pincode])
}

function statusTone(status?: string) {
  const value = String(status ?? '').toLowerCase()
  if (value.includes('deliver')) return 'bg-primary-container/25 text-primary'
  if (value === 'ready_for_delivery') return 'bg-secondary-container/25 text-secondary'
  if (value.includes('ready') || value === 'at_pickup') return 'bg-tertiary-container/20 text-tertiary'
  if (value.includes('cancel')) return 'bg-error-container/30 text-error'
  return 'bg-surface-container-high text-on-surface-variant'
}

function formatStatus(status?: string, variant?: 'available' | 'assigned') {
  const value = String(status ?? 'unknown').toLowerCase()
  if (variant === 'assigned' && value === 'ready_for_delivery') return 'Heading to pickup'
  if (value === 'at_pickup') return 'At shop'
  if (value === 'picked_up') return 'En route to customer'
  if (value === 'out_for_delivery') return 'At customer'
  if (value === 'delivered') return 'Delivered'
  return formatOrderStatusLabel(value)
}

function resolveContactStage(status?: string, variant?: 'available' | 'assigned'): ContactStage {
  if (variant === 'available') return 'available'
  const value = String(status ?? '').toLowerCase()
  if (value === 'delivered') return 'complete'
  if (value === 'at_pickup') return 'post_pickup'
  if (value === 'picked_up' || value === 'out_for_delivery') return 'delivery'
  return 'pickup'
}

function chipAction(variant: 'primary' | 'ghost' = 'primary') {
  return cn(
    'inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all active:scale-[0.98] sm:text-sm',
    variant === 'primary'
      ? 'bg-primary text-on-primary shadow-[0_8px_16px_-8px_rgba(13,99,27,0.5)]'
      : 'border border-outline-variant/50 bg-surface-container-lowest text-on-surface',
  )
}

function ContactCard({
  tone,
  icon,
  eyebrow,
  title,
  detail,
  phone,
  mapsUrl,
  telUrl,
  navigateLabel,
  callLabel,
  showActions,
}: {
  tone: 'primary' | 'secondary'
  icon: string
  eyebrow: string
  title: string
  detail: string
  phone?: string | null
  mapsUrl?: string | null
  telUrl?: string | null
  navigateLabel: string
  callLabel: string
  showActions: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4">
      <div className={cn('mb-2 flex items-center gap-2', tone === 'primary' ? 'text-primary' : 'text-secondary')}>
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
        <span className="text-[11px] font-bold tracking-wide uppercase">{eyebrow}</span>
      </div>
      <p className="text-sm font-bold text-on-surface">{title}</p>
      {phone ? <p className="mt-0.5 text-sm font-medium text-on-surface">{phone}</p> : null}
      <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{detail}</p>
      {showActions ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={chipAction('primary')}>
              <span className="material-symbols-outlined text-[18px]">near_me</span>
              {navigateLabel}
            </a>
          ) : null}
          {telUrl ? (
            <a href={telUrl} className={chipAction('ghost')}>
              <span className="material-symbols-outlined text-[18px]">call</span>
              {callLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function DeliveryOrderCard({
  order,
  variant = 'assigned',
  highlighted = false,
  action,
  disabled = false,
  feeOnly = false,
}: {
  order: DeliveryOrder
  variant?: 'available' | 'assigned'
  highlighted?: boolean
  action: React.ReactNode
  disabled?: boolean
  feeOnly?: boolean
}) {
  const stage = resolveContactStage(order.status, variant)
  const sellerName =
    typeof order.seller === 'object' && order.seller?.name ? String(order.seller.name) : 'Farm store'
  const customerName =
    typeof order.buyer === 'object' && order.buyer?.name ? String(order.buyer.name) : 'Customer'
  const itemCount = order.items_count ?? null
  const distance =
    order.distance_km != null && Number.isFinite(Number(order.distance_km))
      ? `${Number(order.distance_km).toFixed(1)} km`
      : null
  const dropoffMapsUrl = buildGoogleMapsUrl({
    latitude: order.address?.latitude,
    longitude: order.address?.longitude,
    addressLine: order.address?.address_line,
    city: order.address?.city,
    pincode: order.address?.pincode,
  })
  const pickupMapsUrl = buildGoogleMapsUrl({
    latitude: order.seller?.latitude,
    longitude: order.seller?.longitude,
    addressLine: order.seller?.address_line,
    city: order.seller?.city,
    pincode: order.seller?.pincode,
  })
  const customerTelUrl = buildTelUrl(order.buyer?.phone)
  const storeTelUrl = buildTelUrl(order.seller?.phone)

  const showSellerActions = stage === 'available' || stage === 'pickup'
  const showCustomerBlock = stage === 'post_pickup' || stage === 'delivery'
  const showCustomerActions = showCustomerBlock
  const hideCustomerPrivacy = stage === 'available' || stage === 'pickup'

  return (
    <article
      className={cn(
        'overflow-hidden rounded-[1.75rem] bg-surface shadow-[0_8px_28px_-12px_rgba(15,40,20,0.18)] transition-all',
        highlighted && 'ring-2 ring-primary/25',
        disabled && 'opacity-70',
      )}
    >
      <div
        className={cn(
          'px-5 py-4',
          highlighted
            ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary'
            : 'border-b border-outline-variant/25 bg-surface-container-low/50',
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p
              className={cn(
                'text-[11px] font-semibold tracking-[0.12em] uppercase',
                highlighted ? 'text-on-primary/75' : 'text-on-surface-variant',
              )}
            >
              {variant === 'available' ? 'Available run' : 'Active run'}
            </p>
            <h2 className={cn('mt-1 text-lg font-bold', highlighted ? 'text-on-primary' : 'text-on-surface')}>
              {order.order_number ?? order.uuid.slice(0, 8)}
            </h2>
            {order.created_at ? (
              <p className={cn('mt-1 text-sm', highlighted ? 'text-on-primary/80' : 'text-on-surface-variant')}>
                Placed {formatOrderDateTime(order.created_at)}
              </p>
            ) : null}
          </div>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-bold capitalize',
              highlighted ? 'bg-white/20 text-on-primary' : statusTone(order.status),
            )}
          >
            {formatStatus(order.status, variant)}
          </span>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid gap-3">
          <ContactCard
            tone="primary"
            icon="storefront"
            eyebrow={stage === 'pickup' || stage === 'available' ? 'Pickup' : 'Pickup (reference)'}
            title={sellerName}
            detail={formatPickupAddress(order)}
            phone={order.seller?.phone}
            mapsUrl={pickupMapsUrl}
            telUrl={storeTelUrl}
            navigateLabel="Navigate"
            callLabel="Call"
            showActions={showSellerActions}
          />

          {hideCustomerPrivacy ? (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">lock</span>
                <span className="text-[11px] font-bold tracking-wide uppercase">Drop-off</span>
              </div>
              <p className="text-sm font-semibold text-on-surface">Customer details unlock after pickup</p>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                Navigate to the shop first. Customer name, phone, and address appear once you reach the store.
              </p>
            </div>
          ) : showCustomerBlock ? (
            <ContactCard
              tone="secondary"
              icon="location_on"
              eyebrow={order.address?.label ? `Drop-off · ${order.address.label}` : 'Drop-off'}
              title={customerName}
              detail={formatDropoffAddress(order)}
              phone={order.buyer?.phone}
              mapsUrl={dropoffMapsUrl}
              telUrl={customerTelUrl}
              navigateLabel="Navigate"
              callLabel="Call"
              showActions={showCustomerActions}
            />
          ) : null}
        </div>

        {stage === 'delivery' || stage === 'post_pickup' ? (
          storeTelUrl ? (
            <p className="text-xs text-on-surface-variant">
              Need the store?{' '}
              <a href={storeTelUrl} className="font-semibold text-primary">
                Call {sellerName}
              </a>
            </p>
          ) : null
        ) : null}

        <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
          {itemCount != null ? (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </span>
          ) : null}
          {distance ? (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">route</span>
              {distance}
            </span>
          ) : null}
          {order.delivery_charge != null ? (
            <span className={cn('inline-flex items-center gap-1 font-bold text-on-surface', feeOnly && 'ml-auto')}>
              <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
              {feeOnly ? 'Your fee' : 'Fee'} {formatCurrency(order.delivery_charge)}
            </span>
          ) : null}
          {!feeOnly && order.total != null ? (
            <span className="ml-auto font-bold text-on-surface">{formatCurrency(order.total)}</span>
          ) : null}
        </div>

        <div className="pt-1">{action}</div>
      </div>
    </article>
  )
}

export function DeliveryHistoryCard({ order }: { order: DeliveryHistoryOrder }) {
  const sellerName =
    typeof order.seller === 'object' && order.seller?.name ? String(order.seller.name) : 'Farm store'
  const customerName =
    typeof order.buyer === 'object' && order.buyer?.name ? String(order.buyer.name) : null
  const distance =
    order.distance_km != null && Number.isFinite(Number(order.distance_km))
      ? `${Number(order.distance_km).toFixed(1)} km`
      : null
  const deliveredAt = order.delivered_at ?? order.created_at

  return (
    <article className="rounded-[1.5rem] bg-surface px-5 py-4 shadow-[0_4px_20px_-10px_rgba(15,40,20,0.16)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-on-surface-variant uppercase">
            {formatOrderStatusLabel(order.status ?? 'delivered')}
          </p>
          <h2 className="mt-1 text-base font-bold text-on-surface">
            {order.order_number ?? order.uuid.slice(0, 8)}
          </h2>
          {deliveredAt ? (
            <p className="mt-1 text-sm text-on-surface-variant">
              Completed {formatOrderDateTime(deliveredAt)}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl bg-primary-container/15 px-3 py-2 text-right">
          <p className="text-[10px] font-bold tracking-wide text-primary uppercase">Earned</p>
          <p className="text-base font-bold text-on-surface">
            {formatCurrency(order.earning ?? order.delivery_charge ?? 0)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">storefront</span>
          {sellerName}
        </span>
        {customerName ? (
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">person</span>
            {customerName}
          </span>
        ) : null}
        {distance ? (
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">route</span>
            {distance}
          </span>
        ) : null}
        {order.items_count != null ? (
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            {order.items_count} item{order.items_count === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
    </article>
  )
}

export function DeliveryEmptyState({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.75rem] bg-surface px-6 py-14 text-center shadow-[0_4px_20px_-10px_rgba(15,40,20,0.14)]">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary-container/15 text-primary">
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-bold text-on-surface">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-on-surface-variant">{description}</p>
    </div>
  )
}
