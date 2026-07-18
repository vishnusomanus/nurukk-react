import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/utils/cn'

type LatLng = { lat: number; lng: number }

function courierIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:9999px;background:#0d631b;color:white;box-shadow:0 8px 18px -8px rgba(13,99,27,0.7);border:3px solid white;">
      <span class="material-symbols-outlined" style="font-size:20px;line-height:1;">delivery_dining</span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

function dropoffIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#964900;color:white;box-shadow:0 8px 18px -8px rgba(150,73,0,0.55);border:3px solid white;">
      <span class="material-symbols-outlined" style="font-size:18px;line-height:1;">home</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

export function OrderLiveTrackingMap({
  agent,
  dropoff,
  className,
  agentLabel = 'Courier',
  dropoffLabel = 'Your address',
}: {
  agent?: LatLng | null
  dropoff?: LatLng | null
  className?: string
  agentLabel?: string
  dropoffLabel?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const agentMarkerRef = useRef<L.Marker | null>(null)
  const dropoffMarkerRef = useRef<L.Marker | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)

  const hasAgent = Boolean(agent && Number.isFinite(agent.lat) && Number.isFinite(agent.lng))
  const hasDropoff = Boolean(dropoff && Number.isFinite(dropoff.lat) && Number.isFinite(dropoff.lng))

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!hasAgent && !hasDropoff) return

    const center = hasAgent
      ? ([agent!.lat, agent!.lng] as [number, number])
      : ([dropoff!.lat, dropoff!.lng] as [number, number])

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, 14)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map

    const resize = () => map.invalidateSize()
    window.setTimeout(resize, 80)
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      map.remove()
      mapRef.current = null
      agentMarkerRef.current = null
      dropoffMarkerRef.current = null
      lineRef.current = null
    }
  }, [hasAgent, hasDropoff])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const points: L.LatLngExpression[] = []

    if (hasDropoff && dropoff) {
      const pos: L.LatLngExpression = [dropoff.lat, dropoff.lng]
      points.push(pos)
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = L.marker(pos, { icon: dropoffIcon() })
          .bindTooltip(dropoffLabel, { direction: 'top', offset: [0, -12] })
          .addTo(map)
      } else {
        dropoffMarkerRef.current.setLatLng(pos)
      }
    }

    if (hasAgent && agent) {
      const pos: L.LatLngExpression = [agent.lat, agent.lng]
      points.push(pos)
      if (!agentMarkerRef.current) {
        agentMarkerRef.current = L.marker(pos, { icon: courierIcon() })
          .bindTooltip(agentLabel, { direction: 'top', offset: [0, -14] })
          .addTo(map)
      } else {
        agentMarkerRef.current.setLatLng(pos)
      }
    } else if (agentMarkerRef.current) {
      map.removeLayer(agentMarkerRef.current)
      agentMarkerRef.current = null
    }

    if (hasAgent && hasDropoff && agent && dropoff) {
      const path: L.LatLngExpression[] = [
        [agent.lat, agent.lng],
        [dropoff.lat, dropoff.lng],
      ]
      if (!lineRef.current) {
        lineRef.current = L.polyline(path, {
          color: '#0d631b',
          weight: 3,
          opacity: 0.55,
          dashArray: '6 8',
        }).addTo(map)
      } else {
        lineRef.current.setLatLngs(path)
      }
    } else if (lineRef.current) {
      map.removeLayer(lineRef.current)
      lineRef.current = null
    }

    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 })
    } else if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 14))
    }
  }, [agent, dropoff, hasAgent, hasDropoff, agentLabel, dropoffLabel])

  if (!hasAgent && !hasDropoff) {
    return (
      <div
        className={cn(
          'flex h-56 items-center justify-center rounded-2xl bg-surface-container-low px-4 text-center text-sm text-on-surface-variant',
          className,
        )}
      >
        Live map will appear once the courier is on the way.
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl bg-surface-container-low shadow-sm', className)}>
      <div ref={containerRef} className="h-56 w-full sm:h-72" />
      <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/30 px-3 py-2 text-[11px] font-semibold text-on-surface-variant">
        {hasAgent ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" />
            Courier
          </span>
        ) : null}
        {hasDropoff ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-secondary" />
            Drop-off
          </span>
        ) : null}
        {!hasAgent && hasDropoff ? (
          <span className="font-medium">Waiting for live courier location…</span>
        ) : null}
      </div>
    </div>
  )
}
