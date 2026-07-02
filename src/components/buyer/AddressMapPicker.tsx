import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/utils/cn'

export type MapPosition = {
  lat: number
  lng: number
}

type AddressMapPickerProps = {
  position: MapPosition
  onPositionChange: (position: MapPosition) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onSearchSubmit: () => void
  onLocate: () => void
  locating?: boolean
  loading?: boolean
  error?: string | null
  className?: string
  overlayClassName?: string
  /** When set, draws a delivery-radius circle around the pin (km). */
  radiusKm?: number
  pinHint?: string
}

const RADIUS_STYLE = {
  color: '#0d631b',
  weight: 2,
  fillColor: '#0d631b',
  fillOpacity: 0.12,
} as const

export function AddressMapPicker({
  position,
  onPositionChange,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onLocate,
  locating = false,
  loading = false,
  error,
  className,
  overlayClassName,
  radiusKm,
  pinHint = 'Drag the map to position the pin exactly on your delivery location.',
}: AddressMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const radiusCircleRef = useRef<L.Circle | null>(null)
  const skipMoveRef = useRef(false)
  const onPositionChangeRef = useRef(onPositionChange)
  const radiusKmRef = useRef(radiusKm)

  onPositionChangeRef.current = onPositionChange
  radiusKmRef.current = radiusKm

  const syncRadiusCircle = (map: L.Map) => {
    const km = radiusKmRef.current
    if (km == null || km <= 0) {
      radiusCircleRef.current?.remove()
      radiusCircleRef.current = null
      return
    }

    const center = map.getCenter()
    const radiusMeters = km * 1000

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng(center)
      radiusCircleRef.current.setRadius(radiusMeters)
      return
    }

    radiusCircleRef.current = L.circle(center, {
      ...RADIUS_STYLE,
      radius: radiusMeters,
      interactive: false,
    }).addTo(map)
  }

  const fitRadiusInView = (map: L.Map) => {
    const circle = radiusCircleRef.current
    if (!circle) return

    map.fitBounds(circle.getBounds(), {
      padding: [56, 56],
      animate: true,
      maxZoom: 16,
    })
  }

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container || mapRef.current) return

    const map = L.map(container, {
      center: [position.lat, position.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: true,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomleft' }).addTo(map)

    const handleMapMove = () => {
      syncRadiusCircle(map)
    }

    map.on('move', handleMapMove)
    map.on('zoom', handleMapMove)

    map.on('moveend', () => {
      syncRadiusCircle(map)

      if (skipMoveRef.current) {
        skipMoveRef.current = false
        return
      }

      const center = map.getCenter()
      onPositionChangeRef.current({ lat: center.lat, lng: center.lng })
    })

    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
      syncRadiusCircle(map)
    })
    resizeObserver.observe(container)

    map.whenReady(() => {
      requestAnimationFrame(() => {
        map.invalidateSize()
        syncRadiusCircle(map)
        if (radiusKmRef.current != null && radiusKmRef.current > 0) {
          fitRadiusInView(map)
        }
      })
    })

    window.setTimeout(() => map.invalidateSize(), 150)

    return () => {
      resizeObserver.disconnect()
      map.off('move', handleMapMove)
      map.off('zoom', handleMapMove)
      radiusCircleRef.current?.remove()
      radiusCircleRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const center = map.getCenter()
    const latDiff = Math.abs(center.lat - position.lat)
    const lngDiff = Math.abs(center.lng - position.lng)
    if (latDiff < 0.00001 && lngDiff < 0.00001) return

    skipMoveRef.current = true
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true })

    if (radiusKmRef.current != null && radiusKmRef.current > 0) {
      map.once('moveend', () => {
        syncRadiusCircle(map)
        fitRadiusInView(map)
      })
    }
  }, [position.lat, position.lng])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    syncRadiusCircle(map)

    if (radiusKm != null && radiusKm > 0) {
      fitRadiusInView(map)
      return
    }

    radiusCircleRef.current?.remove()
    radiusCircleRef.current = null
  }, [radiusKm])

  return (
    <div className={cn('relative flex min-h-[280px] flex-col bg-surface-container', className)}>
      <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

      <div className={cn('pointer-events-none absolute inset-0 z-[15]', overlayClassName)}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <span
            className="material-symbols-outlined block text-[48px] leading-none text-primary drop-shadow-md"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            location_on
          </span>
        </div>
      </div>

      <div className="pointer-events-none relative z-20 flex h-full min-h-[280px] flex-col justify-between p-4 md:p-6">
        <form
          className="pointer-events-auto flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/90 p-3 shadow-sm backdrop-blur-md"
          onSubmit={(e) => {
            e.preventDefault()
            onSearchSubmit()
          }}
        >
          <span className="material-symbols-outlined text-primary">search</span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search for location..."
            className="text-body-md w-full border-none bg-transparent outline-none focus:ring-0"
          />
          {loading ? (
            <span className="material-symbols-outlined animate-spin text-primary text-[20px]">
              progress_activity
            </span>
          ) : null}
        </form>

        <div className="pointer-events-none flex flex-col gap-3">
          <button
            type="button"
            onClick={onLocate}
            disabled={locating}
            className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-full bg-surface-container-lowest text-primary shadow-lg transition-all hover:bg-primary hover:text-on-primary active:scale-90 disabled:opacity-60"
            title="Use current location"
          >
            <span
              className={cn(
                'material-symbols-outlined flex h-6 w-6 items-center justify-center text-[24px] leading-none',
                locating && 'animate-pulse',
              )}
            >
              my_location
            </span>
          </button>

          <div className="pointer-events-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest/90 p-4 shadow-sm backdrop-blur-md">
            <p className="text-label-md mb-1 text-primary">{radiusKm ? 'STORE LOCATION' : 'ADJUST PIN'}</p>
            <p className="text-body-md leading-tight text-on-surface-variant">{pinHint}</p>
            {error ? <p className="text-body-md mt-2 text-error">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
