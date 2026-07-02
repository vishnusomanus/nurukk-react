import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { isDeliveryServiceable, type DeliveryCheckResult } from '@/utils/deliveryCheck'
import {
  getStoredDeliveryCheck,
  setStoredDeliveryCheck,
  type StoredDeliveryCheck,
} from '@/utils/deliveryLocationStorage'
import { fetchDeliveryFromGeolocation } from '@/utils/fetchDeliveryFromGeolocation'

export type DeliveryLocationMeta = {
  latitude: number
  longitude: number
  city?: string
  pincode?: string
}

type DeliveryLocationContextValue = {
  stored: StoredDeliveryCheck | null
  locating: boolean
  error: string | null
  detectLocation: () => Promise<void>
  applyLocation: (result: DeliveryCheckResult, meta: DeliveryLocationMeta) => void
}

const DeliveryLocationContext = createContext<DeliveryLocationContextValue | null>(null)

let inflightDetect: Promise<void> | null = null

function toStored(result: DeliveryCheckResult, meta: DeliveryLocationMeta): StoredDeliveryCheck {
  return {
    latitude: meta.latitude,
    longitude: meta.longitude,
    pincode: meta.pincode ?? undefined,
    city: meta.city ?? result.city ?? undefined,
    serviceable: isDeliveryServiceable(result),
    delivery_charge: result.delivery_charge,
    nearest_store_km: result.nearest_store_km,
    max_delivery_radius_km: result.max_delivery_radius_km,
    reason: result.reason,
  }
}

export function DeliveryLocationProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredDeliveryCheck | null>(() => getStoredDeliveryCheck())
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  const applyLocation = useCallback((result: DeliveryCheckResult, meta: DeliveryLocationMeta) => {
    const next = toStored(result, meta)
    setStoredDeliveryCheck(next)
    setStored(next)
    setError(null)
  }, [])

  const detectLocation = useCallback(async () => {
    if (inflightDetect) {
      await inflightDetect
      return
    }

    setLocating(true)
    setError(null)

    inflightDetect = (async () => {
      try {
        const data = await fetchDeliveryFromGeolocation()
        const next = toStored(data.result, {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          pincode: data.pincode,
        })
        setStoredDeliveryCheck(next)
        setStored(next)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not detect your location.'
        setError(message)
      } finally {
        setLocating(false)
        inflightDetect = null
      }
    })()

    await inflightDetect
  }, [])

  useEffect(() => {
    if (started.current) return
    started.current = true
    void detectLocation()
  }, [detectLocation])

  const value = useMemo(
    () => ({ stored, locating, error, detectLocation, applyLocation }),
    [stored, locating, error, detectLocation, applyLocation],
  )

  return <DeliveryLocationContext.Provider value={value}>{children}</DeliveryLocationContext.Provider>
}

export function useDeliveryLocation() {
  const context = useContext(DeliveryLocationContext)
  if (!context) {
    throw new Error('useDeliveryLocation must be used within DeliveryLocationProvider')
  }
  return context
}
