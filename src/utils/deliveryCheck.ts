export type DeliveryCheckResult = {
  serviceable?: boolean
  is_serviceable?: boolean
  delivery_charge?: number
  max_delivery_radius_km?: number
  nearest_store_km?: number
  reason?: string
  latitude?: number | null
  longitude?: number | null
  city?: string | null
  pincode?: string | null
}

export function isDeliveryServiceable(result: DeliveryCheckResult | null | undefined) {
  if (!result) return false
  return result.is_serviceable ?? result.serviceable ?? false
}

export function formatDeliveryCheckMessage(result: DeliveryCheckResult) {
  const serviceable = isDeliveryServiceable(result)
  const maxKm = result.max_delivery_radius_km

  if (serviceable) {
    const parts = ['Delivery available']
    if (result.delivery_charge != null) parts.push(`from ₹${result.delivery_charge}`)
    if (result.nearest_store_km != null) {
      parts.push(`nearest store ${result.nearest_store_km.toFixed(1)} km away`)
    }
    return parts.join(' · ')
  }

  if (result.reason === 'outside_delivery_radius') {
    return `We'll be available within ${maxKm ?? 'the service'} km of this location soon.`
  }

  return "We'll be available here soon — try a nearby location or check back later."
}
