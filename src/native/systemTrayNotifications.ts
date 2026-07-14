import { Capacitor } from '@capacitor/core'
import type { PushAlertPayload } from '@/native/pushAlertBus'

let ready = false
let permissionGranted = false

function notificationIdFor(payload: PushAlertPayload) {
  const seed = payload.notificationUuid || `${payload.type ?? ''}-${payload.title}-${Date.now()}`
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  // Keep within 32-bit positive int range expected by Capacitor local notifications.
  const id = Math.abs(hash) % 2_000_000_000
  return id === 0 ? 1 : id
}

async function ensureReady() {
  if (ready) return permissionGranted

  if (!Capacitor.isNativePlatform()) {
    if (typeof Notification === 'undefined') {
      ready = true
      permissionGranted = false
      return false
    }
    try {
      if (Notification.permission === 'granted') {
        permissionGranted = true
      } else if (Notification.permission !== 'denied') {
        permissionGranted = (await Notification.requestPermission()) === 'granted'
      }
    } catch {
      permissionGranted = false
    }
    ready = true
    return permissionGranted
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: 'default',
        name: 'General',
        description: 'Order and account updates',
        importance: 5,
        visibility: 1,
        vibration: true,
      })
      await LocalNotifications.createChannel({
        id: 'high_priority',
        name: 'Urgent',
        description: 'New orders and delivery alerts',
        importance: 5,
        visibility: 1,
        vibration: true,
      })
    }

    const current = await LocalNotifications.checkPermissions()
    if (current.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions()
      permissionGranted = requested.display === 'granted'
    } else {
      permissionGranted = true
    }

    if (!permissionGranted) {
      console.warn('[tray] Notification permission not granted')
    }
  } catch (err) {
    console.warn('[tray] Local notification setup failed', err)
    permissionGranted = false
  }

  ready = true
  return permissionGranted
}

/** Show an OS notification-bar / tray notification (Android/iOS/Web). */
export async function showSystemTrayNotification(payload: PushAlertPayload) {
  const title = payload.title?.trim() || 'nurukk'
  const body = payload.body?.trim() || ''
  if (!title && !body) return

  const ok = await ensureReady()
  if (!ok) {
    console.warn('[tray] Skipping notification — permission missing')
    return
  }

  if (!Capacitor.isNativePlatform()) {
    try {
      const n = new Notification(title, {
        body,
        tag: payload.notificationUuid || payload.type || undefined,
        data: {
          order_uuid: payload.orderUuid,
          deep_link: payload.deepLink,
          type: payload.type,
        },
      })
      n.onclick = () => {
        window.focus()
        n.close()
      }
    } catch (err) {
      console.warn('[tray] Web Notification failed', err)
    }
    return
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    // iOS rejects schedules that are not strictly after "now". Use 2s buffer.
    const at = new Date(Date.now() + 2000)
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationIdFor(payload),
          title,
          body,
          channelId: payload.highPriority ? 'high_priority' : 'default',
          schedule: { at },
          extra: {
            order_uuid: payload.orderUuid,
            deep_link: payload.deepLink,
            type: payload.type,
            notification_uuid: payload.notificationUuid,
          },
        },
      ],
    })
    console.info('[tray] Scheduled system notification', title)
  } catch (err) {
    console.warn('[tray] LocalNotifications.schedule failed', err)
  }
}

export async function initSystemTrayNotifications() {
  try {
    await ensureReady()
  } catch (err) {
    console.warn('[tray] init failed', err)
  }
}

/** Fire a one-shot tray smoke test (useful on iOS Simulator). */
export async function showTestSystemTrayNotification() {
  await showSystemTrayNotification({
    title: 'Notifications enabled',
    body: 'You will see order updates here.',
    type: 'system_test',
    highPriority: false,
  })
}
