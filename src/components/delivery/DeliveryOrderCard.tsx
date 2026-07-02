import type { DeliveryHistoryOrder, DeliveryOrder } from '@/api/services/deliveryService'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'
import { buildGoogleMapsUrl, buildTelUrl } from '@/utils/googleMaps'
import { cn } from '@/utils/cn'

export type { DeliveryOrder } from '@/api/services/deliveryService'

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
  if (value.includes('deliver')) return 'bg-primary-container/20 text-primary'
  if (value === 'ready_for_delivery') return 'bg-secondary/10 text-secondary'
  if (value.includes('ready')) return 'bg-tertiary-container/20 text-tertiary'
  if (value.includes('cancel')) return 'bg-error-container/30 text-error'
  return 'bg-surface-container-high text-on-surface-variant'
}

function formatStatus(status?: string, variant?: 'available' | 'assigned') {
  const value = String(status ?? 'unknown').toLowerCase()
  if (variant === 'assigned' && value === 'ready_for_delivery') return 'Heading to pickup'
  if (value === 'at_pickup') return 'At pickup location'
  if (value === 'picked_up') return 'En route to customer'
  if (value === 'out_for_delivery') return 'At customer location'
  return value.replace(/_/g, ' ')
}

function contactActionClassName(variant: 'primary' | 'secondary' = 'primary') {
  return cn(
    'flex w-full min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold leading-tight transition-all active:scale-[0.98] sm:px-4 sm:text-label-md',
    variant === 'primary'
      ? 'bg-primary text-on-primary hover:brightness-110'
      : 'border-2 border-secondary text-secondary hover:bg-secondary/10',
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
  const sellerName =
    typeof order.seller === 'object' && order.seller?.name ? String(order.seller.name) : 'Farm store'
  const itemCount = order.items_count ?? null
  const distance =
    order.distance_km != null && Number.isFinite(Number(order.distance_km))
      ? `${Number(order.distance_km).toFixed(1)} km`
      : null
  const mapsUrl = buildGoogleMapsUrl({
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
  const hasContactActions = Boolean(mapsUrl || pickupMapsUrl || customerTelUrl || storeTelUrl)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-surface stitch-card-shadow transition-all',
        highlighted
          ? 'border-primary/30 bg-gradient-to-br from-primary-container/10 to-surface'
          : 'border-outline-variant/40',
        disabled && 'opacity-70',
      )}
    >
      <div className="border-b border-outline-variant/30 bg-surface-container-low/60 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-label-md tracking-wide text-on-surface-variant uppercase">
              {variant === 'available' ? 'Next delivery' : 'Active delivery'}
            </p>
            <h2 className="text-headline-lg text-on-surface">{order.order_number ?? order.uuid.slice(0, 8)}</h2>
            {order.created_at ? (
              <p className="text-body-md mt-1 text-on-surface-variant">
                Placed {formatOrderDateTime(order.created_at)}
              </p>
            ) : null}
          </div>
          <span className={cn('rounded-full px-3 py-1 text-label-md capitalize', statusTone(order.status))}>
            {formatStatus(order.status, variant)}
          </span>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-container-low p-4">
            <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span className="text-label-md uppercase">Pickup</span>
            </div>
            <p className="text-body-md font-semibold text-on-surface">{sellerName}</p>
            <p className="text-body-md mt-1 text-on-surface">{formatPickupAddress(order)}</p>
          </div>

          <div className="rounded-xl bg-surface-container-low p-4">
            <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span className="text-label-md uppercase">Drop-off</span>
            </div>
            {order.address?.label ? (
              <p className="text-label-md mb-1 text-primary">{order.address.label}</p>
            ) : null}
            <p className="text-body-md text-on-surface">{formatDropoffAddress(order)}</p>
          </div>
        </div>

        {hasContactActions ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {pickupMapsUrl ? (
              <a
                href={pickupMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={contactActionClassName('primary')}
              >
                <span className="material-symbols-outlined shrink-0 text-[20px]">storefront</span>
                <span>Open pickup in Maps</span>
              </a>
            ) : null}
            {storeTelUrl ? (
              <a href={storeTelUrl} className={contactActionClassName('secondary')}>
                <span className="material-symbols-outlined shrink-0 text-[20px]">call</span>
                <span>Call store</span>
              </a>
            ) : null}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={contactActionClassName('primary')}
              >
                <span className="material-symbols-outlined shrink-0 text-[20px]">map</span>
                <span>Open drop-off in Maps</span>
              </a>
            ) : null}
            {customerTelUrl ? (
              <a href={customerTelUrl} className={contactActionClassName('secondary')}>
                <span className="material-symbols-outlined shrink-0 text-[20px]">call</span>
                <span>Call customer</span>
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 text-body-md text-on-surface-variant">
          {itemCount != null ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </span>
          ) : null}
          {distance ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">route</span>
              {distance}
            </span>
          ) : null}
          {order.delivery_charge != null ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5',
                feeOnly && 'ml-auto font-bold text-on-surface',
              )}
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              {feeOnly ? 'Your fee' : 'Fee'} {formatCurrency(order.delivery_charge)}
            </span>
          ) : null}
          {!feeOnly && order.total != null ? (
            <span className="ml-auto font-bold text-on-surface">Order {formatCurrency(order.total)}</span>
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
  const distance =
    order.distance_km != null && Number.isFinite(Number(order.distance_km))
      ? `${Number(order.distance_km).toFixed(1)} km`
      : null
  const deliveredAt = order.delivered_at ?? order.created_at

  return (
    <article className="rounded-2xl border border-outline-variant/40 bg-surface px-5 py-4 stitch-card-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-label-md uppercase text-on-surface-variant">Completed delivery</p>
          <h2 className="text-headline-lg text-on-surface">{order.order_number ?? order.uuid.slice(0, 8)}</h2>
          {deliveredAt ? (
            <p className="text-body-md mt-1 text-on-surface-variant">
              Delivered {formatOrderDateTime(deliveredAt)}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-label-md uppercase text-primary">Earned</p>
          <p className="text-headline-lg text-on-surface">
            {formatCurrency(order.earning ?? order.delivery_charge ?? 0)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-body-md text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">storefront</span>
          {sellerName}
        </span>
        {distance ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">route</span>
            {distance}
          </span>
        ) : null}
        {order.items_count != null ? (
          <span className="inline-flex items-center gap-1.5">
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
    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface px-6 py-14 text-center">
      <span className="material-symbols-outlined mb-4 text-5xl text-outline">{icon}</span>
      <h3 className="text-headline-lg text-on-surface">{title}</h3>
      <p className="text-body-md mx-auto mt-2 max-w-sm text-on-surface-variant">{description}</p>
    </div>
  )
}
