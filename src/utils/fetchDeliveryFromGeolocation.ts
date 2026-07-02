import { buyerService } from '@/api/services'
import type { DeliveryCheckResult } from '@/utils/deliveryCheck'
import { normalizeIndianPincode } from '@/utils/normalizeIndianPincode'
import { getCurrentPosition, reverseGeocode } from '@/utils/nominatim'

export type GeolocationDeliveryCheck = {
  pincode?: string
  city?: string
  latitude: number
  longitude: number
  result: DeliveryCheckResult
}

function geolocationErrorMessage(error: unknown) {
  if (error instanceof GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      return 'Location permission denied. Pin your location on the map instead.'
    }
    if (error.code === error.TIMEOUT) {
      return 'Location request timed out. Try again or pin on the map.'
    }
    return 'Could not detect your location. Pin your location on the map instead.'
  }

  if (error instanceof Error) return error.message
  return 'Could not detect your location. Pin your location on the map instead.'
}

export async function fetchDeliveryFromGeolocation(): Promise<GeolocationDeliveryCheck> {
  try {
    const position = await getCurrentPosition()
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    const geo = await reverseGeocode(latitude, longitude)
    const pincode = normalizeIndianPincode(geo.pincode) || undefined

    const response = await buyerService.checkDeliveryLocation({
      latitude,
      longitude,
      pincode,
    })
    const result = response.data ?? {}

    return {
      pincode: pincode ?? result.pincode ?? undefined,
      city: geo.city ?? result.city ?? undefined,
      latitude,
      longitude,
      result,
    }
  } catch (error) {
    throw new Error(geolocationErrorMessage(error))
  }
}
