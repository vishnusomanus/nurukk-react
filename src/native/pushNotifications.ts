import { Capacitor } from '@capacitor/core'
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
import { isBuyerRole, isSellerRole, normalizeRole } from '@/utils/authRole'

export type { PushAlertPayload }
export { subscribePushAlerts, emitForegroundPushAlert }

const PENDING_TOKEN_KEY = 'nurukk_pending_fcm_token'

function resolveAppSlug(): 'buyer' | 'seller' | 'delivery' {
  if (APP_ROLE === 'seller') return 'seller'
  if (APP_ROLE === 'delivery') return 'delivery'
  if (APP_ROLE === 'buyer') return 'buyer'

  const role = normalizeRole(useAuthStore.getState().user?.role)
  if (isSellerRole(role)) return 'seller'
  if (role === 'delivery_agent' || role === 'seller_delivery') return 'delivery'
  if (isBuyerRole(role)) return 'buyer'
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
    type === 'delivery_available' ||
    type === 'delivery_assigned'

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

function rememberToken(tokenValue: string) {
  lastNativeToken = tokenValue
  try {
    localStorage.setItem(PENDING_TOKEN_KEY, tokenValue)
  } catch {
    // ignore quota / private mode
  }
}

function readRememberedToken(): string | null {
  if (lastNativeToken) return lastNativeToken
  try {
    return localStorage.getItem(PENDING_TOKEN_KEY)
  } catch {
    return null
  }
}

async function registerNativeToken(tokenValue: string) {
  const authToken = useAuthStore.getState().token
  if (!authToken) {
    rememberToken(tokenValue)
    console.info('[push] FCM token cached — will sync after login')
    return
  }

  try {
    await notificationsService.registerDeviceToken({
      token: tokenValue,
      platform: Capacitor.getPlatform() === 'ios' ? 'ios' : 'android',
      app: resolveAppSlug(),
      locale: navigator.language?.slice(0, 12),
    })
    rememberToken(tokenValue)
    console.info('[push] Device token registered with API')
  } catch (err) {
    console.error('[push] Device token register failed', err)
  }
}

let nativeInitialized = false
let lastNativeToken: string | null = null

/**
 * Ask for permission, create Android channels, and obtain an FCM/APNs token.
 * Safe to call before login — the token is cached until auth exists.
 * Must run once while the app is open so background/killed FCM can deliver later.
 */
export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    try {
      const web = await import('@/native/webPushNotifications')
      await web.initWebPushNotifications()
    } catch (err) {
      console.warn('[push] web push init failed', err)
    }
    return
  }

  if (nativeInitialized) {
    const token = readRememberedToken()
    if (token) await registerNativeToken(token)
    return
  }
  nativeInitialized = true

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    void PushNotifications.addListener('registration', (token) => {
      rememberToken(token.value)
      void registerNativeToken(token.value)
    })

    void PushNotifications.addListener('registrationError', (err) => {
      console.error('[push] Native registration error', err)
    })

    void PushNotifications.addListener('pushNotificationReceived', (notification) => {
      const payload = parsePushData(notification.data as Record<string, unknown> | undefined)
      payload.title = notification.title || payload.title || 'Notification'
      payload.body = notification.body || payload.body || ''
      // Foreground only — Cap presentationOptions omit alert so we show exactly
      // one tray via LocalNotifications (deduped against inbox poll).
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
        emitForegroundPushAlert(payload, { skipTray: true })
        return
      }

      navigateFromPush(payload)
    })

    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') {
      console.warn('[push] Notification permission not granted', permission)
      return
    }

    if (Capacitor.getPlatform() === 'android') {
      try {
        await PushNotifications.createChannel({
          id: 'default',
          name: 'General',
          importance: 5,
          visibility: 1,
          sound: 'default',
        })
        await PushNotifications.createChannel({
          id: 'high_priority',
          name: 'Urgent',
          importance: 5,
          visibility: 1,
          sound: 'default',
          vibration: true,
        })
      } catch (err) {
        console.warn('[push] createChannel failed', err)
      }
    }

    await PushNotifications.register()
  } catch (err) {
    console.warn('[push] Native push init failed (app continues)', err)
  }
}

/** After login: ensure FCM is registered and the token is stored on the API. */
export async function syncPushRegistration() {
  const authToken = useAuthStore.getState().token
  if (!authToken) return

  try {
    if (Capacitor.isNativePlatform()) {
      await initPushNotifications()
      const token = readRememberedToken()
      if (token) await registerNativeToken(token)
    } else {
      const web = await import('@/native/webPushNotifications')
      await web.syncWebPushRegistration()
    }
    await notificationsService.heartbeat().catch(() => undefined)
  } catch (err) {
    console.warn('[push] syncPushRegistration failed', err)
  }
}

export async function unregisterPushToken() {
  try {
    if (!Capacitor.isNativePlatform()) {
      const web = await import('@/native/webPushNotifications')
      const token = web.getLastWebPushToken()
      if (token) await notificationsService.unregisterDeviceToken(token)
      return
    }
    const token = readRememberedToken()
    if (token) {
      await notificationsService.unregisterDeviceToken(token)
    }
    try {
      localStorage.removeItem(PENDING_TOKEN_KEY)
    } catch {
      // ignore
    }
    lastNativeToken = null
  } catch {
    // ignore
  }
}
