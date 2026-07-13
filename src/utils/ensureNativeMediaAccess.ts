import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'

/**
 * Ensures the seller native app can access camera / photo library before
 * opening an `<input type="file" accept="image/*">` picker.
 * Returns false only when the user explicitly denies access on a native build.
 */
export async function ensureNativeMediaAccess(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true

  try {
    const current = await Camera.checkPermissions()
    if (
      current.camera === 'granted' ||
      current.photos === 'granted' ||
      current.photos === 'limited'
    ) {
      return true
    }

    const requested = await Camera.requestPermissions({
      permissions: ['camera', 'photos'],
    })

    return (
      requested.camera === 'granted' ||
      requested.photos === 'granted' ||
      requested.photos === 'limited'
    )
  } catch {
    // Plugin missing / unsupported — still attempt the system file picker.
    return true
  }
}
