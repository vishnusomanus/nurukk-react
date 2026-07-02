export type StoredDeliveryCheck = {
  latitude: number
  longitude: number
  pincode?: string
  city?: string
  serviceable: boolean
  delivery_charge?: number
  nearest_store_km?: number
  max_delivery_radius_km?: number
  reason?: string
}

const STORAGE_KEY = 'buyer-delivery-check'

export function getStoredDeliveryCheck(): StoredDeliveryCheck | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDeliveryCheck
    if (parsed?.latitude == null || parsed?.longitude == null) return null
    return parsed
  } catch {
    return null
  }
}

export function setStoredDeliveryCheck(value: StoredDeliveryCheck) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

export function deliveryCheckLabel(stored: StoredDeliveryCheck | null, locating = false) {
  if (locating) return 'Locating...'
  if (!stored) return 'Set location'
  return stored.city?.trim() || stored.pincode || 'Your location'
}

export function deliveryCheckSubLabel(stored: StoredDeliveryCheck | null, locating = false) {
  if (locating) return 'Finding nearby stores'
  if (!stored) return 'Tap to set delivery area'
  if (stored.serviceable) {
    if (stored.nearest_store_km != null) {
      return `Nearest store ${stored.nearest_store_km.toFixed(1)} km away`
    }
    return 'Stores deliver here'
  }
  return 'No stores in range'
}
