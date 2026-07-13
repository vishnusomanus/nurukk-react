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

type PushAlertListener = (payload: PushAlertPayload) => void

const alertListeners = new Set<PushAlertListener>()

export function subscribePushAlerts(listener: PushAlertListener) {
  alertListeners.add(listener)
  return () => {
    alertListeners.delete(listener)
  }
}

export function emitForegroundPushAlert(payload: PushAlertPayload) {
  for (const listener of alertListeners) {
    listener(payload)
  }
}
