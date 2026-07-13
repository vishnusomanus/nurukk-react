import { initializeApp, type FirebaseApp, getApps } from 'firebase/app'
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics'
import { getMessaging, isSupported as isMessagingSupported, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      firebaseConfig.messagingSenderId,
  )
}

let app: FirebaseApp | null = null
let analytics: Analytics | null = null
let messaging: Messaging | null = null

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null
  if (app) return app
  app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig)
  return app
}

export async function getFirebaseAnalytics() {
  if (analytics) return analytics
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp || typeof window === 'undefined') return null
  if (!(await isAnalyticsSupported())) return null
  analytics = getAnalytics(firebaseApp)
  return analytics
}

export async function getFirebaseMessaging() {
  if (messaging) return messaging
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp || typeof window === 'undefined') return null
  if (!(await isMessagingSupported())) return null
  messaging = getMessaging(firebaseApp)
  return messaging
}

export function getFirebaseVapidKey() {
  const key = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined
  return key?.trim() || null
}

export { firebaseConfig }
