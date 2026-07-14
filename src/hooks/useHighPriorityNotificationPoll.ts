import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listNotifications } from '@/api/services/notificationsService'
import {
  emitForegroundPushAlert,
  wasNotificationSurfaced,
} from '@/native/pushAlertBus'
import { useAuthStore } from '@/store/authStore'

/**
 * While the app is open, poll unread notifications and surface new ones
 * when OS push is missing. Dedupes against FCM-delivered items.
 */
export function useHighPriorityNotificationPoll() {
  const token = useAuthStore((s) => s.token)
  const enabled = !!token
  const seenRef = useRef(new Set<string>())
  const primedRef = useRef(false)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', 'in-app-poll'],
    queryFn: () => listNotifications({ per_page: 15, unread_only: true }),
    enabled,
    refetchInterval: enabled ? 12_000 : false,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    const rows = query.data?.data
    if (!Array.isArray(rows)) return

    if (!primedRef.current) {
      for (const row of rows) seenRef.current.add(row.uuid)
      primedRef.current = true
      return
    }

    let surfaced = false
    for (const row of rows) {
      if (seenRef.current.has(row.uuid)) continue
      seenRef.current.add(row.uuid)

      // Already shown via FCM / local tray / in-app alert.
      if (wasNotificationSurfaced(row.uuid)) continue

      surfaced = true

      const type = String(row.type ?? '')
      const highPriority =
        type === 'new_order' || type === 'delivery_available' || type === 'delivery_assigned'
      const orderUuid =
        typeof row.data?.order_uuid === 'string' ? row.data.order_uuid : undefined

      emitForegroundPushAlert({
        title: row.title ?? 'Notification',
        body: row.body ?? '',
        type,
        orderUuid,
        highPriority,
        notificationUuid: row.uuid,
        deepLink: row.deep_link ?? undefined,
        actions: Array.isArray(row.data?.actions) ? (row.data.actions as string[]) : undefined,
      })
    }

    if (surfaced) {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  }, [query.data, queryClient])
}
