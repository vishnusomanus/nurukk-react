import type { BuyerOrder } from '@/api/services/buyerService'

export type OrderTrackingInfo = {
  current_status?: string
  status_label?: string
  eta_label?: string
  estimated_delivery_minutes_min?: number
  estimated_delivery_minutes_max?: number
  delivery_assigned?: boolean
  delivery_agent_name?: string | null
  is_live_delivery?: boolean
  delivery_completed_duration_minutes?: number
  delivery_completed_duration_label?: string
  delivery_started_at?: string
  delivery_completed_at?: string
}

export function estimateDeliveryMinutes(distanceKm?: number | null) {
  const distance = Math.max(0, Number(distanceKm) || 0)
  const min = Math.max(15, Math.round(distance * 4 + 12))
  return { min, max: min + 10 }
}

export function resolveOrderTracking(
  order?: Pick<BuyerOrder, 'status' | 'distance_km' | 'tracking'> | null,
  track?: OrderTrackingInfo | null,
): OrderTrackingInfo {
  if (track?.status_label) {
    const live = track.is_live_delivery ?? canTrackFromStatus(track.current_status ?? order?.status, track)
    return {
      ...track,
      eta_label: live ? track.eta_label : undefined,
    }
  }
  if (order?.tracking && typeof order.tracking === 'object') {
    const tracking = order.tracking as OrderTrackingInfo
    const live = tracking.is_live_delivery ?? canTrackFromStatus(order.status, tracking)
    return {
      ...tracking,
      eta_label: live ? tracking.eta_label : undefined,
    }
  }

  const status = String(track?.current_status ?? order?.status ?? '').toLowerCase()
  const assigned = Boolean(track?.delivery_assigned)
  const live = canTrackFromStatus(status, { delivery_assigned: assigned })
  const { min, max } = estimateDeliveryMinutes(order?.distance_km)

  if (status === 'out_for_delivery') {
    return {
      current_status: status,
      status_label: 'Out for delivery',
      eta_label: live ? `Arriving in ${Math.max(5, min - 15)}–${Math.max(10, min - 5)} min` : undefined,
      estimated_delivery_minutes_min: Math.max(5, min - 15),
      estimated_delivery_minutes_max: Math.max(10, min - 5),
      delivery_assigned: true,
      delivery_agent_name: track?.delivery_agent_name ?? null,
    }
  }

  if (status === 'ready_for_delivery' && assigned) {
    return {
      current_status: status,
      status_label: 'Courier heading to store',
      eta_label: live ? `Store pickup in ${Math.max(10, min - 10)}–${Math.max(15, min)} min` : undefined,
      estimated_delivery_minutes_min: Math.max(10, min - 10),
      estimated_delivery_minutes_max: Math.max(15, min),
      delivery_assigned: true,
      delivery_agent_name: track?.delivery_agent_name ?? null,
    }
  }

  if (status === 'at_pickup') {
    return {
      current_status: status,
      status_label: 'At pickup location',
      eta_label: live ? `Package collection in ${Math.max(5, min - 15)}–${Math.max(10, min - 8)} min` : undefined,
      estimated_delivery_minutes_min: Math.max(5, min - 15),
      estimated_delivery_minutes_max: Math.max(10, min - 8),
      delivery_assigned: true,
      delivery_agent_name: track?.delivery_agent_name ?? null,
    }
  }

  if (status === 'picked_up') {
    return {
      current_status: status,
      status_label: 'Order picked up',
      eta_label: live ? `Estimated delivery in ${Math.max(10, min - 5)}–${min + 10} min` : undefined,
      estimated_delivery_minutes_min: Math.max(10, min - 5),
      estimated_delivery_minutes_max: min + 10,
      delivery_assigned: true,
      delivery_agent_name: track?.delivery_agent_name ?? null,
    }
  }

  if (status === 'ready_for_delivery') {
    return {
      current_status: status,
      status_label: 'Waiting for courier',
      eta_label: undefined,
      estimated_delivery_minutes_min: Math.max(15, min - 5),
      estimated_delivery_minutes_max: min + 15,
      delivery_assigned: false,
    }
  }

  if (status === 'preparing' || status === 'packed') {
    return {
      current_status: status,
      status_label: status === 'preparing' ? 'Being prepared' : 'Packed & ready',
      eta_label: undefined,
      estimated_delivery_minutes_min: min + 15,
      estimated_delivery_minutes_max: min + 30,
    }
  }

  if (status === 'accepted') {
    return {
      current_status: status,
      status_label: 'Order confirmed',
      eta_label: undefined,
      estimated_delivery_minutes_min: min + 25,
      estimated_delivery_minutes_max: min + 45,
    }
  }

  if (status === 'pending') {
    return {
      current_status: status,
      status_label: 'Order placed',
      eta_label: undefined,
      estimated_delivery_minutes_min: min + 30,
      estimated_delivery_minutes_max: min + 50,
    }
  }

  if (status === 'delivered') {
    return {
      current_status: status,
      status_label: 'Delivered',
      eta_label: 'Your order has arrived',
    }
  }

  return {
    current_status: status,
    status_label: 'In progress',
    eta_label: undefined,
    estimated_delivery_minutes_min: min,
    estimated_delivery_minutes_max: max,
  }
}

function canTrackFromStatus(
  status?: string,
  tracking?: { delivery_assigned?: boolean; is_live_delivery?: boolean },
) {
  if (tracking?.is_live_delivery != null) {
    return Boolean(tracking.is_live_delivery)
  }
  const normalized = String(status ?? '').toLowerCase()
  if (['at_pickup', 'picked_up', 'out_for_delivery'].includes(normalized)) return true
  if (normalized === 'ready_for_delivery') return Boolean(tracking?.delivery_assigned)
  return false
}

/** Shared labels for order status snake_case values in UI + notification copy. */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  packed: 'Packed',
  ready_for_delivery: 'Ready for delivery',
  at_pickup: 'At pickup',
  picked_up: 'Picked up',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function formatOrderStatusLabel(status: string) {
  const key = String(status ?? '')
    .toLowerCase()
    .trim()
  if (!key) return 'Unknown'
  if (ORDER_STATUS_LABELS[key]) return ORDER_STATUS_LABELS[key]
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Replace known status slugs (e.g. out_for_delivery) in notification title/body. */
export function humanizeNotificationText(text: string): string {
  if (!text) return text
  return text.replace(/\b[a-z]+(?:_[a-z]+)+\b/gi, (match) => {
    const key = match.toLowerCase()
    if (ORDER_STATUS_LABELS[key]) return ORDER_STATUS_LABELS[key]
    return match
  })
}
