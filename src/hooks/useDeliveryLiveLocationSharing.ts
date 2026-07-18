import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Capacitor } from '@capacitor/core'
import { deliveryService } from '@/api/services'
import { extractRows } from '@/utils/extractRows'
import { normalizeDeliveryStatus } from '@/utils/deliveryAgentAction'
import { getCurrentPosition } from '@/utils/nominatim'

const PING_INTERVAL_MS = 12_000

function shouldShareLocation(status?: string | null) {
  const value = normalizeDeliveryStatus(status)
  return (
    value === 'picked_up' ||
    value === 'package_collected' ||
    value === 'collected' ||
    value === 'out_for_delivery' ||
    value === 'reached_customer' ||
    value === 'at_customer'
  )
}

/**
 * While the courier has an active on-the-way delivery, stream GPS to the API
 * so buyers can see live location on the tracking map.
 */
export function useDeliveryLiveLocationSharing(enabled = true) {
  const watchIdRef = useRef<string | number | null>(null)
  const lastPingAtRef = useRef(0)
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null)

  const { data } = useQuery({
    queryKey: ['delivery', 'orders', 'location-share'],
    queryFn: () => deliveryService.listAssignedOrders({ page: 1, per_page: 5 }),
    enabled,
    refetchInterval: enabled ? 15_000 : false,
  })

  const activeOrder = extractRows(data?.data).find((row) =>
    shouldShareLocation(typeof row.status === 'string' ? row.status : null),
  )
  const shouldPing = enabled && Boolean(activeOrder)

  useEffect(() => {
    if (!shouldPing) {
      void clearWatch(watchIdRef)
      return
    }

    let cancelled = false

    const ping = async (latitude: number, longitude: number) => {
      if (cancelled) return
      const now = Date.now()
      const prev = lastCoordsRef.current
      const moved =
        !prev ||
        Math.abs(prev.lat - latitude) > 0.00005 ||
        Math.abs(prev.lng - longitude) > 0.00005
      if (!moved && now - lastPingAtRef.current < PING_INTERVAL_MS) return
      if (now - lastPingAtRef.current < 4_000) return

      lastPingAtRef.current = now
      lastCoordsRef.current = { lat: latitude, lng: longitude }
      try {
        await deliveryService.pingLocation({ latitude, longitude })
      } catch {
        // Keep watching; transient network errors are fine.
      }
    }

    const start = async () => {
      try {
        const first = await getCurrentPosition()
        await ping(first.coords.latitude, first.coords.longitude)
      } catch {
        // Permission denied or GPS unavailable — stop quietly.
        return
      }

      if (cancelled) return

      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation')
        const id = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 20_000, maximumAge: 5_000 },
          (position, err) => {
            if (err || !position) return
            void ping(position.coords.latitude, position.coords.longitude)
          },
        )
        watchIdRef.current = id
        return
      }

      if (!navigator.geolocation) return
      const id = navigator.geolocation.watchPosition(
        (position) => {
          void ping(position.coords.latitude, position.coords.longitude)
        },
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
      )
      watchIdRef.current = id
    }

    void start()

    return () => {
      cancelled = true
      void clearWatch(watchIdRef)
    }
  }, [shouldPing, activeOrder?.uuid])
}

async function clearWatch(watchIdRef: { current: string | number | null }) {
  const id = watchIdRef.current
  watchIdRef.current = null
  if (id == null) return

  if (typeof id === 'string' || Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation')
      await Geolocation.clearWatch({ id: String(id) })
    } catch {
      // ignore
    }
    return
  }

  navigator.geolocation.clearWatch(id)
}
