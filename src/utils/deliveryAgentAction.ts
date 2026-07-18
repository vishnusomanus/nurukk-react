export type DeliveryAgentAction =
  | 'accept'
  | 'reached_pickup'
  | 'collect_package'
  | 'reached_customer'
  | 'mark_delivered'

/** Normalize API status values for delivery-agent CTA matching. */
export function normalizeDeliveryStatus(status?: string | null) {
  return String(status ?? '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_')
}

/**
 * Map an assigned-order status to the next courier action.
 * Only known statuses map to actions — never guess "Reached shop" for later stages.
 */
export function resolveAssignedDeliveryAction(status?: string | null): DeliveryAgentAction | null {
  const value = normalizeDeliveryStatus(status)

  if (!value || value === 'delivered' || value === 'cancelled') return null

  if (value === 'at_pickup') return 'collect_package'
  if (value === 'picked_up' || value === 'package_collected' || value === 'collected') {
    return 'reached_customer'
  }
  if (value === 'out_for_delivery' || value === 'reached_customer' || value === 'at_customer') {
    return 'mark_delivered'
  }

  // After accept, status stays ready_for_delivery until the agent marks arrived at shop.
  if (value === 'ready_for_delivery' || value === 'assigned') {
    return 'reached_pickup'
  }

  return null
}

export function orderStatusFromDeliveryResponse(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  const data = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root
  const status = data.status
  return typeof status === 'string' ? status : null
}

export function deliveryActionLabel(action: DeliveryAgentAction, pending: boolean) {
  if (pending) {
    if (action === 'accept') return 'Accepting…'
    if (action === 'mark_delivered') return 'Updating…'
    return 'Updating…'
  }

  switch (action) {
    case 'accept':
      return 'Accept delivery'
    case 'reached_pickup':
      return 'Reached shop'
    case 'collect_package':
      return 'Package collected'
    case 'reached_customer':
      return 'Reached customer'
    case 'mark_delivered':
      return 'Mark delivered'
  }
}

export function deliveryActionIcon(action: DeliveryAgentAction) {
  switch (action) {
    case 'accept':
      return 'check_circle'
    case 'reached_pickup':
      return 'storefront'
    case 'collect_package':
      return 'inventory_2'
    case 'reached_customer':
      return 'location_on'
    case 'mark_delivered':
      return 'done_all'
  }
}
