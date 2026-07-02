import { useMemo } from 'react'
import { useDeliveryLocation } from '@/context/DeliveryLocationProvider'
import { getStoredDeliveryCheck } from '@/utils/deliveryLocationStorage'

export type DeliveryScopeParams = {
  latitude?: number
  longitude?: number
}

export function getDeliveryScopeParams(): DeliveryScopeParams {
  const stored = getStoredDeliveryCheck()
  if (stored?.latitude == null || stored?.longitude == null) {
    return {}
  }

  return {
    latitude: stored.latitude,
    longitude: stored.longitude,
  }
}

export function useDeliveryScopeParams(): DeliveryScopeParams {
  const { stored } = useDeliveryLocation()

  return useMemo(() => {
    if (stored?.latitude == null || stored?.longitude == null) {
      return getDeliveryScopeParams()
    }

    return {
      latitude: stored.latitude,
      longitude: stored.longitude,
    }
  }, [stored?.latitude, stored?.longitude])
}

export function useDeliveryScopeActive() {
  const params = useDeliveryScopeParams()
  return params.latitude != null && params.longitude != null
}

export function useDeliveryScopeLabel() {
  const { stored } = useDeliveryLocation()
  const maxKm = stored?.max_delivery_radius_km ?? 15
  const active = useDeliveryScopeActive()

  if (!active) return null

  const area = stored?.city?.trim() || stored?.pincode || 'your location'

  return `Showing products from stores that deliver within ${maxKm} km of ${area}`
}
