import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { APP_ROLE } from '@/config/appRole'
import { notificationsService } from '@/api/services'
import { router } from '@/routes'
import { useAuthStore } from '@/store/authStore'
import { getNotificationHref } from '@/utils/notificationNavigation'
import type { AppNotification } from '@/api/services/notificationsService'
import {
  emitForegroundPushAlert,
  subscribePushAlerts,
  type PushAlertPayload,
} from '@/native/pushAlertBus'
import {
  getLastWebPushToken,
  initWebPushNotifications,
  syncWebPushRegistration,
} from '@/native/webPushNotifications'

export type { PushAlertPayload }
export { subscribePushAlerts, emitForegroundPushAlert }

function resolveAppSlug(): 'buyer' | 'seller' | 'delivery' {
  if (APP_ROLE === 'seller') return 'seller'
  if (APP_ROLE === 'delivery') return 'delivery'
  return 'buyer'
}

function parsePushData(data: Record<string, unknown> | undefined): PushAlertPayload {
  const raw = data ?? {}
  const type = typeof raw.type === 'string' ? raw.type : undefined
  const orderUuid = typeof raw.order_uuid === 'string' ? raw.order_uuid : undefined
  const highPriority =
    raw.high_priority === true ||
    raw.high_priority === '1' ||
    raw.high_priority === 'true' ||
    type === 'new_order' ||
    type === 'delivery_available'

  let actions: string[] | undefined
  if (Array.isArray(raw.actions)) {
    actions = raw.actions.map(String)
  } else if (typeof raw.actions === 'string') {
    try {
      const parsed = JSON.parse(raw.actions) as unknown
      if (Array.isArray(parsed)) actions = parsed.map(String)
    } catch {
      actions = raw.actions.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    body: typeof raw.body === 'string' ? raw.body : '',
    type,
    orderUuid,
    highPriority,
    actions,
    notificationUuid: typeof raw.notification_uuid === 'string' ? raw.notification_uuid : undefined,
    deepLink: typeof raw.deep_link === 'string' ? raw.deep_link : undefined,
  }
}

function navigateFromPush(payload: PushAlertPayload) {
  const user = useAuthStore.getState().user
  if (payload.deepLink) {
    void router.navigate(payload.deepLink)
    return
  }

  const fake: AppNotification = {
    uuid: payload.notificationUuid ?? 'push',
    type: payload.type,
    data: { order_uuid: payload.orderUuid },
  }
  const href = getNotificationHref(fake, user?.role)
  if (href) void router.navigate(href)
}

let nativeInitialized = false

/** Register FCM/APNs listeners and sync the device token with the API. */
export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    await initWebPushNotifications()
    return
  }

  if (nativeInitialized) return
  nativeInitialized = true

  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return

  await PushNotifications.register()

  void PushNotifications.addListener('registration', (token) => {
    const authToken = useAuthStore.getState().token
    if (!authToken) return
    void notificationsService
      .registerDeviceToken({
        token: token.value,
        platform: Capacitor.getPlatform() === 'ios' ? 'ios' : 'android',
        app: resolveAppSlug(),
        locale: navigator.language?.slice(0, 12),
      })
      .catch(() => undefined)
  })

  void PushNotifications.addListener('registrationError', () => undefined)

  void PushNotifications.addListener('pushNotificationReceived', (notification) => {
    const payload = parsePushData(notification.data as Record<string, unknown> | undefined)
    payload.title = notification.title || payload.title || 'Notification'
    payload.body = notification.body || payload.body || ''
    emitForegroundPushAlert(payload)
  })

  void PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const payload = parsePushData(event.notification.data as Record<string, unknown> | undefined)
    payload.title = event.notification.title || payload.title || 'Notification'
    payload.body = event.notification.body || payload.body || ''

    if (payload.notificationUuid) {
      void notificationsService.trackClick(payload.notificationUuid).catch(() => undefined)
    }

    if (payload.highPriority) {
      emitForegroundPushAlert(payload)
      return
    }

    navigateFromPush(payload)
  })
}

export async function syncPushRegistration() {
  const authToken = useAuthStore.getState().token
  if (!authToken) return

  try {
    if (Capacitor.isNativePlatform()) {
      await initPushNotifications()
    } else {
      await syncWebPushRegistration()
    }
    await notificationsService.heartbeat()
  } catch {
    // Push is optional until Firebase / native credentials are fully configured.
  }
}

export async function unregisterPushToken() {
  const token = getLastWebPushToken()
  if (!token) return
  try {
    await notificationsService.unregisterDeviceToken(token)
  } catch {
    // ignore
  }
}
