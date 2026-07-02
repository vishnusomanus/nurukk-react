import type { AppNotification } from '@/api/services/notificationsService'
import { getHomePathForRole, isAdminRole, isBuyerRole, isSellerRole, normalizeRole } from '@/utils/authRole'

export function getNotificationsPagePath(role?: string | null) {
  return `${getHomePathForRole(role)}/notifications`
}

export function getNotificationHref(
  notification: AppNotification,
  role?: string | null,
): string | null {
  const orderUuid =
    typeof notification.data?.order_uuid === 'string' ? notification.data.order_uuid : null

  if (!orderUuid) return null

  const r = normalizeRole(role)

  if (isBuyerRole(r)) {
    return `/buyer/orders/${orderUuid}/success`
  }

  if (isSellerRole(r)) {
    return `/seller/orders/${orderUuid}`
  }

  if (r === 'delivery_agent' || r === 'seller_delivery') {
    return '/delivery'
  }

  if (isAdminRole(r)) {
    return `/admin/orders/${orderUuid}`
  }

  return null
}

export function notificationIcon(type?: string) {
  const value = String(type ?? '').toLowerCase()

  if (value.includes('delivered')) return 'check_circle'
  if (value.includes('cancel') || value.includes('reject')) return 'cancel'
  if (value.includes('picked') || value.includes('courier') || value.includes('delivery')) {
    return 'local_shipping'
  }
  if (value.includes('order')) return 'receipt_long'
  if (value.includes('payment')) return 'payments'

  return 'notifications'
}

export function formatNotificationTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
