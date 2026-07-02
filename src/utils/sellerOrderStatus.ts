export type SellerOrderTab = 'active' | 'completed' | 'cancelled'

export type SellerOrderStatusConfig = {
  label: string
  badgeClass: string
  highlight?: boolean
}

const STATUS_CONFIG: Record<string, SellerOrderStatusConfig> = {
  pending: {
    label: 'New Order',
    badgeClass: 'bg-secondary/10 text-secondary',
    highlight: true,
  },
  accepted: {
    label: 'Accepted',
    badgeClass: 'bg-primary/10 text-primary',
  },
  preparing: {
    label: 'Preparing',
    badgeClass: 'bg-primary/10 text-primary',
  },
  packed: {
    label: 'Packed',
    badgeClass: 'bg-primary-container/20 text-primary',
  },
  ready_for_delivery: {
    label: 'Ready to Ship',
    badgeClass: 'bg-tertiary-container/20 text-tertiary',
  },
  picked_up: {
    label: 'Picked Up',
    badgeClass: 'bg-secondary/10 text-secondary',
  },
  at_pickup: {
    label: 'At Pickup',
    badgeClass: 'bg-tertiary-container/20 text-tertiary',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    badgeClass: 'bg-secondary/10 text-secondary',
    highlight: true,
  },
  delivered: {
    label: 'Delivered',
    badgeClass: 'bg-primary-container/20 text-primary',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-error-container text-error',
  },
}

export function sellerOrderStatusConfig(status?: string): SellerOrderStatusConfig {
  return STATUS_CONFIG[status ?? ''] ?? {
    label: status?.replace(/_/g, ' ') ?? 'Unknown',
    badgeClass: 'bg-surface-variant/40 text-on-surface-variant',
  }
}

export function filterSellerOrdersByTab<T extends { status: string }>(
  orders: T[],
  tab: SellerOrderTab,
): T[] {
  const active = new Set(['pending', 'accepted', 'preparing', 'packed', 'ready_for_delivery', 'at_pickup', 'picked_up', 'out_for_delivery'])

  if (tab === 'active') return orders.filter((order) => active.has(order.status))
  if (tab === 'completed') return orders.filter((order) => order.status === 'delivered')
  return orders.filter((order) => order.status === 'cancelled')
}

export function sellerOrderLabel(orderNumber?: string | null, uuid?: string): string {
  if (orderNumber) return `#${orderNumber}`
  if (uuid) return `#${uuid.slice(0, 8).toUpperCase()}`
  return '—'
}
