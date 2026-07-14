import {
  getToken,
  onMessage,
  type Messaging,
} from 'firebase/messaging'
import {
  getFirebaseAnalytics,
  getFirebaseMessaging,
  getFirebaseVapidKey,
  isFirebaseConfigured,
} from '@/lib/firebase'
import { APP_ROLE } from '@/config/appRole'
import { notificationsService } from '@/api/services'
import { useAuthStore } from '@/store/authStore'
import { emitForegroundPushAlert } from '@/native/pushAlertBus'

function resolveAppSlug(): 'buyer' | 'seller' | 'delivery' {
  if (APP_ROLE === 'seller') return 'seller'
  if (APP_ROLE === 'delivery') return 'delivery'
  return 'buyer'
}

function serviceWorkerUrl() {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}firebase-messaging-sw.js`
}

async function ensureMessagingServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.register(serviceWorkerUrl(), {
    scope: import.meta.env.BASE_URL || '/',
  })
  await navigator.serviceWorker.ready
  return registration
}

function parseData(data: Record<string, unknown> | undefined) {
  const raw = data ?? {}
  const type = typeof raw.type === 'string' ? raw.type : undefined
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    body: typeof raw.body === 'string' ? raw.body : '',
    type,
    orderUuid: typeof raw.order_uuid === 'string' ? raw.order_uuid : undefined,
    highPriority:
      raw.high_priority === true ||
      raw.high_priority === '1' ||
      raw.high_priority === 'true' ||
      type === 'new_order' ||
      type === 'delivery_available',
    notificationUuid:
      typeof raw.notification_uuid === 'string' ? raw.notification_uuid : undefined,
    deepLink: typeof raw.deep_link === 'string' ? raw.deep_link : undefined,
  }
}

let webInitialized = false
let webToken: string | null = null

async function registerWebToken(messaging: Messaging, registration: ServiceWorkerRegistration) {
  const vapidKey = getFirebaseVapidKey()
  if (!vapidKey) {
    console.warn(
      '[firebase] VITE_FIREBASE_VAPID_KEY is missing. Add a Web Push certificate key from Firebase Console → Project settings → Cloud Messaging.',
    )
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  })

  if (!token) return null

  webToken = token
  const authToken = useAuthStore.getState().token
  if (!authToken) return token

  await notificationsService.registerDeviceToken({
    token,
    platform: 'web',
    app: resolveAppSlug(),
    locale: navigator.language?.slice(0, 12),
  })

  return token
}

export async function initWebPushNotifications() {
  if (webInitialized || !isFirebaseConfigured()) return
  webInitialized = true

  void getFirebaseAnalytics().catch(() => null)

  const messaging = await getFirebaseMessaging()
  if (!messaging) return

  const registration = await ensureMessagingServiceWorker()
  if (!registration) return

  onMessage(messaging, (payload) => {
    const parsed = parseData(payload.data as Record<string, unknown> | undefined)
    // Foreground web: Firebase may not auto-show; we show one tray via emit.
    emitForegroundPushAlert({
      title: payload.notification?.title || parsed.title || 'Notification',
      body: payload.notification?.body || parsed.body || '',
      type: parsed.type,
      orderUuid: parsed.orderUuid,
      highPriority: parsed.highPriority,
      notificationUuid: parsed.notificationUuid,
      deepLink: parsed.deepLink,
    })
  })

  try {
    await registerWebToken(messaging, registration)
  } catch (err) {
    console.warn('[firebase] Web push registration failed', err)
  }
}

export async function syncWebPushRegistration() {
  if (!isFirebaseConfigured()) return
  await initWebPushNotifications()

  const messaging = await getFirebaseMessaging()
  if (!messaging) return

  const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL || '/')
  if (!registration) return

  try {
    await registerWebToken(messaging, registration)
  } catch {
    // ignore
  }
}

export function getLastWebPushToken() {
  return webToken
}
