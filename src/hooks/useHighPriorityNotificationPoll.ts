import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listNotifications } from '@/api/services/notificationsService'
import { emitForegroundPushAlert } from '@/native/pushAlertBus'
import { useAuthStore } from '@/store/authStore'
import { isSellerRole, normalizeRole } from '@/utils/authRole'

/** Poll inbox for high-priority alerts while the seller/delivery app is open. */
export function useHighPriorityNotificationPoll() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const role = normalizeRole(user?.role)
  const enabled =
    !!token && (isSellerRole(role) || role === 'delivery_agent' || role === 'seller_delivery')
  const seenRef = useRef(new Set<string>())
  const primedRef = useRef(false)

  const query = useQuery({
    queryKey: ['notifications', 'high-priority-poll', role],
    queryFn: () => listNotifications({ per_page: 10, unread_only: true }),
    enabled,
    refetchInterval: enabled ? 15_000 : false,
  })

  useEffect(() => {
    const rows = query.data?.data ?? []
    if (!Array.isArray(rows)) return

    if (!primedRef.current) {
      for (const row of rows) {
        seenRef.current.add(row.uuid)
      }
      primedRef.current = true
      return
    }

    for (const row of rows) {
      const type = String(row.type ?? '')
      if (type !== 'new_order' && type !== 'delivery_available' && type !== 'delivery_assigned') {
        continue
      }
      if (seenRef.current.has(row.uuid)) continue
      seenRef.current.add(row.uuid)

      const orderUuid =
        typeof row.data?.order_uuid === 'string' ? row.data.order_uuid : undefined

      emitForegroundPushAlert({
        title: row.title ?? 'Alert',
        body: row.body ?? '',
        type,
        orderUuid,
        highPriority: true,
        notificationUuid: row.uuid,
        deepLink: row.deep_link ?? undefined,
        actions: Array.isArray(row.data?.actions) ? (row.data.actions as string[]) : undefined,
      })
    }
  }, [query.data])
}
