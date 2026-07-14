export type PushAlertPayload = {
  title: string
  body: string
  type?: string
  orderUuid?: string
  highPriority?: boolean
  actions?: string[]
  notificationUuid?: string
  deepLink?: string
}

export type EmitPushAlertOptions = {
  /**
   * Skip LocalNotifications / Web Notification.
   * Use when FCM/Capacitor already posted a system tray alert.
   */
  skipTray?: boolean
}

type PushAlertListener = (payload: PushAlertPayload) => void

const alertListeners = new Set<PushAlertListener>()
/** uuid → timestamp — suppress FCM + poll + local tray duplicates */
const surfacedAt = new Map<string, number>()
const SURFACED_TTL_MS = 3 * 60_000

function pruneSurfaced() {
  const cutoff = Date.now() - SURFACED_TTL_MS
  for (const [id, at] of surfacedAt) {
    if (at < cutoff) surfacedAt.delete(id)
  }
}

export function markNotificationSurfaced(uuid?: string | null) {
  if (!uuid) return
  pruneSurfaced()
  surfacedAt.set(uuid, Date.now())
}

export function wasNotificationSurfaced(uuid?: string | null, withinMs = SURFACED_TTL_MS): boolean {
  if (!uuid) return false
  const at = surfacedAt.get(uuid)
  if (at == null) return false
  return Date.now() - at < withinMs
}

export function subscribePushAlerts(listener: PushAlertListener) {
  alertListeners.add(listener)
  return () => {
    alertListeners.delete(listener)
  }
}

/**
 * High-priority alerts open the in-app modal.
 * System tray is optional — skip when OS push already displayed one.
 */
export function emitForegroundPushAlert(
  payload: PushAlertPayload,
  options: EmitPushAlertOptions = {},
) {
  if (wasNotificationSurfaced(payload.notificationUuid)) {
    return
  }
  markNotificationSurfaced(payload.notificationUuid)

  if (!options.skipTray) {
    void import('@/native/systemTrayNotifications')
      .then((m) => m.showSystemTrayNotification(payload))
      .catch((err) => console.warn('[tray] failed to load', err))
  }

  if (!payload.highPriority) return

  for (const listener of alertListeners) {
    listener(payload)
  }
}
