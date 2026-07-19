import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/utils/cn'
import { hasGoogleMapsApiKey, loadGoogleMaps } from '@/utils/googleMapsLoader'
import scooterMarkerUrl from '@/assets/stitch/scooter-top-transparent.png'

type LatLng = { lat: number; lng: number }

type RouteSummary = {
  distanceText?: string
  durationText?: string
}

type RoadRoute = {
  path: LatLng[]
  distanceText?: string
  durationText?: string
}

type PathProjection = {
  point: LatLng
  fraction: number
  heading: number
  offlineMeters: number
}

/** Stitch FreshVeg delivery tracker green */
const ROUTE_STROKE = '#22c55e'
const ROUTE_WEIGHT = 4
/** Only re-fetch directions when courier is this far off the drawn road. */
const OFF_ROUTE_REROUTE_METERS = 150
/** Drop-off must move this far before we rebuild the route. */
const DROPOFF_CHANGE_METERS = 25
/** Match buyer track poll (~8s) so motion feels continuous. */
const BIKE_MOVE_MS = 7500
const SCOOTER_W = 28
const SCOOTER_H = 52
const YOU_PIN_W = 28
const YOU_PIN_H = 38

function haversineMeters(a: LatLng, b: LatLng) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

function bearingDegrees(from: LatLng, to: LatLng) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const dLng = toRad(to.lng - from.lng)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

function formatDistance(meters: number) {
  if (!Number.isFinite(meters) || meters <= 0) return undefined
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined
  const mins = Math.max(1, Math.round(seconds / 60))
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return rem ? `${hours} hr ${rem} min` : `${hours} hr`
}

function lerpLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  }
}

function lerpHeading(from: number, to: number, t: number) {
  const delta = ((to - from + 540) % 360) - 180
  return (from + delta * t + 360) % 360
}

function sameCoord(a: LatLng | null | undefined, b: LatLng | null | undefined, eps = 1e-6) {
  if (!a || !b) return false
  return Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps
}

function pathMetrics(path: LatLng[]) {
  const cum = [0]
  for (let i = 1; i < path.length; i += 1) {
    cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]))
  }
  return { cum, total: cum[cum.length - 1] || 0 }
}

function pointAtDistance(path: LatLng[], cum: number[], distance: number) {
  const total = cum[cum.length - 1] || 0
  const d = Math.max(0, Math.min(distance, total))
  if (path.length < 2 || total <= 0) {
    return { point: path[0], heading: 0 }
  }
  let i = 1
  while (i < cum.length && cum[i] < d) i += 1
  const i0 = Math.max(0, i - 1)
  const i1 = Math.min(path.length - 1, i)
  const span = cum[i1] - cum[i0] || 1
  const t = (d - cum[i0]) / span
  return {
    point: lerpLatLng(path[i0], path[i1], t),
    heading: bearingDegrees(path[i0], path[i1 === i0 ? Math.min(i0 + 1, path.length - 1) : i1]),
  }
}

function projectOntoPath(path: LatLng[], target: LatLng): PathProjection {
  if (path.length < 2) {
    const point = path[0] ?? target
    return {
      point,
      fraction: 0,
      heading: 0,
      offlineMeters: haversineMeters(point, target),
    }
  }

  const { cum, total } = pathMetrics(path)
  let bestDist = Infinity
  let bestDistanceAlong = 0
  let bestPoint = path[0]
  let bestHeading = bearingDegrees(path[0], path[1])

  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i]
    const b = path[i + 1]
    const abLat = b.lat - a.lat
    const abLng = b.lng - a.lng
    const abLen2 = abLat * abLat + abLng * abLng || 1e-12
    const t = Math.max(
      0,
      Math.min(1, ((target.lat - a.lat) * abLat + (target.lng - a.lng) * abLng) / abLen2),
    )
    const point = lerpLatLng(a, b, t)
    const dist = haversineMeters(target, point)
    if (dist < bestDist) {
      bestDist = dist
      bestPoint = point
      bestHeading = bearingDegrees(a, b)
      bestDistanceAlong = cum[i] + haversineMeters(a, point)
    }
  }

  return {
    point: bestPoint,
    fraction: total > 0 ? bestDistanceAlong / total : 0,
    heading: bestHeading,
    offlineMeters: bestDist,
  }
}

function samplePathBetween(path: LatLng[], fromFraction: number, toFraction: number): LatLng[] {
  if (path.length < 2) return path.slice()
  const { cum, total } = pathMetrics(path)
  if (total <= 0) return [path[0]]

  const fromD = Math.max(0, Math.min(1, fromFraction)) * total
  const toD = Math.max(0, Math.min(1, toFraction)) * total
  const start = Math.min(fromD, toD)
  const end = Math.max(fromD, toD)
  const reversed = toD < fromD

  const samples: LatLng[] = [pointAtDistance(path, cum, start).point]
  for (let i = 1; i < path.length; i += 1) {
    if (cum[i] > start && cum[i] < end) samples.push(path[i])
  }
  samples.push(pointAtDistance(path, cum, end).point)
  return reversed ? samples.reverse() : samples
}

/** Remaining road ahead of the courier (fraction → destination). */
function remainingPathFromFraction(path: LatLng[], fraction: number): LatLng[] {
  const clamped = Math.max(0, Math.min(1, fraction))
  if (clamped >= 0.999 || path.length < 2) {
    return path.length ? [path[path.length - 1]] : []
  }
  return samplePathBetween(path, clamped, 1)
}

function moveDurationMs(from: LatLng, to: LatLng) {
  const meters = haversineMeters(from, to)
  // Slow crawl for tiny GPS jitter; stretch toward poll interval for bigger moves.
  if (meters < 3) return 900
  return Math.min(BIKE_MOVE_MS, Math.max(2200, meters * 55))
}

async function fetchGoogleRoadRoute(origin: LatLng, destination: LatLng): Promise<RoadRoute | null> {
  try {
    await loadGoogleMaps()
    const service = new google.maps.DirectionsService()
    const result = await service.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: false,
    })
    const route = result.routes[0]
    const leg = route?.legs[0]
    const overview = route?.overview_path
    if (!overview?.length) return null

    return {
      path: overview.map((p) => ({ lat: p.lat(), lng: p.lng() })),
      distanceText: leg?.distance?.text ?? formatDistance(leg?.distance?.value ?? 0),
      durationText: leg?.duration?.text ?? formatDuration(leg?.duration?.value ?? 0),
    }
  } catch {
    return null
  }
}

async function fetchOsrmRoadRoute(origin: LatLng, destination: LatLng): Promise<RoadRoute | null> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson`

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = (await response.json()) as {
      code?: string
      routes?: Array<{
        distance?: number
        duration?: number
        geometry?: { coordinates?: [number, number][] }
      }>
    }
    if (data.code !== 'Ok') return null
    const route = data.routes?.[0]
    const coords = route?.geometry?.coordinates
    if (!coords?.length) return null

    return {
      path: coords.map(([lng, lat]) => ({ lat, lng })),
      distanceText: formatDistance(route?.distance ?? 0),
      durationText: formatDuration(route?.duration ?? 0),
    }
  } catch {
    return null
  }
}

async function fetchRoadRoute(origin: LatLng, destination: LatLng): Promise<RoadRoute | null> {
  if (hasGoogleMapsApiKey()) {
    const googleRoute = await fetchGoogleRoadRoute(origin, destination)
    if (googleRoute?.path.length) return googleRoute
  }
  return fetchOsrmRoadRoute(origin, destination)
}

/**
 * Top-down green delivery scooter (transparent PNG, no square plate).
 * Asset faces north — rotate by compass heading.
 */
function bikeIconHtml(w = SCOOTER_W, h = SCOOTER_H) {
  return `<div class="nurukk-bike-marker" style="
    width:${w}px;height:${h}px;background:transparent;border:0;padding:0;margin:0;
    transform-origin:50% 50%;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));
  "><img src="${scooterMarkerUrl}" alt="" width="${w}" height="${h}" draggable="false" style="
    width:${w}px;height:${h}px;object-fit:contain;display:block;background:transparent;
    border:0;outline:0;box-shadow:none;pointer-events:none;
  "/></div>`
}

/** Compact green destination pin with "You" label — matches Stitch tracker. */
function youPinSvgIcon(): google.maps.Icon {
  const w = YOU_PIN_W
  const h = YOU_PIN_H
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 38">
  <defs>
    <filter id="s" x="-30%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <rect x="4" y="0" width="20" height="11" rx="5.5" fill="#dcfce7" stroke="#86efac" stroke-width="1"/>
    <text x="14" y="8" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="7" font-weight="700" fill="#166534">You</text>
    <path d="M14 36 C14 36 4 24 4 14 a10 10 0 1 1 20 0 C24 24 14 36 14 36z" fill="#22c55e"/>
    <circle cx="14" cy="14" r="4.5" fill="#ffffff"/>
  </g>
</svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(w / 2, h - 1),
  }
}

function courierLeafletIcon(heading = 0) {
  return L.divIcon({
    className: 'nurukk-bike-leaflet',
    html: `<div style="transform:rotate(${heading}deg);background:transparent;">${bikeIconHtml()}</div>`,
    iconSize: [SCOOTER_W, SCOOTER_H],
    iconAnchor: [SCOOTER_W / 2, SCOOTER_H / 2],
  })
}

function dropoffLeafletIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${YOU_PIN_W}px;height:${YOU_PIN_H}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.22));background:transparent;">
      <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);background:#dcfce7;border:1px solid #86efac;color:#166534;font:700 7px/1 system-ui,sans-serif;padding:3px 6px;border-radius:999px;white-space:nowrap;">You</div>
      <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);">
        <svg viewBox="0 0 20 26" width="18" height="24"><path d="M10 25 C10 25 2 16 2 10 a8 8 0 1 1 16 0 C18 16 10 25 10 25z" fill="#22c55e"/><circle cx="10" cy="10" r="3.5" fill="#fff"/></svg>
      </div>
    </div>`,
    iconSize: [YOU_PIN_W, YOU_PIN_H],
    iconAnchor: [YOU_PIN_W / 2, YOU_PIN_H - 1],
  })
}

type BikeOverlayInstance = {
  position: LatLng
  heading: number
  setMap: (map: google.maps.Map | null) => void
  setTitle: (title: string) => void
  setPose: (position: LatLng, heading: number) => void
  animateAlong: (samples: LatLng[], durationMs?: number) => void
}

function createBikeOverlay(
  position: LatLng,
  heading: number,
  title: string,
  onPose?: (position: LatLng, heading: number) => void,
): BikeOverlayInstance {
  class BikeOverlay extends google.maps.OverlayView {
    position: LatLng
    heading: number
    title: string
    private div: HTMLDivElement | null = null
    private animFrame = 0

    constructor(pos: LatLng, head: number, label: string) {
      super()
      this.position = pos
      this.heading = head
      this.title = label
    }

    onAdd() {
      const div = document.createElement('div')
      div.title = this.title
      div.style.cssText =
        'position:absolute;transform:translate(-50%,-50%);will-change:left,top;pointer-events:none;background:transparent;border:0;padding:0;margin:0;overflow:visible;'
      div.innerHTML = bikeIconHtml()
      this.div = div
      this.getPanes()?.overlayMouseTarget.appendChild(div)
      this.applyHeading()
    }

    draw() {
      const projection = this.getProjection()
      if (!projection || !this.div) return
      const point = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(this.position.lat, this.position.lng),
      )
      if (!point) return
      this.div.style.left = `${point.x}px`
      this.div.style.top = `${point.y}px`
    }

    onRemove() {
      if (this.animFrame) cancelAnimationFrame(this.animFrame)
      this.div?.remove()
      this.div = null
    }

    setTitle(nextTitle: string) {
      this.title = nextTitle
      if (this.div) this.div.title = nextTitle
    }

    applyHeading() {
      const inner = this.div?.querySelector('.nurukk-bike-marker') as HTMLElement | null
      if (!inner) return
      // Top-view icon faces north — rotate by compass heading.
      inner.style.transform = `rotate(${this.heading}deg)`
    }

    setPose(nextPosition: LatLng, nextHeading: number) {
      this.position = nextPosition
      this.heading = nextHeading
      this.applyHeading()
      this.draw()
      onPose?.(nextPosition, nextHeading)
    }

    animateAlong(samples: LatLng[], durationMs = BIKE_MOVE_MS) {
      if (this.animFrame) cancelAnimationFrame(this.animFrame)
      if (samples.length < 2) {
        if (samples[0]) this.setPose(samples[0], this.heading)
        return
      }

      const { cum, total } = pathMetrics(samples)
      if (total < 0.5) {
        const end = samples[samples.length - 1]
        this.setPose(end, this.heading)
        return
      }

      const startHeading = this.heading
      const start = performance.now()

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs)
        const { point, heading: head } = pointAtDistance(samples, cum, total * t)
        this.setPose(point, lerpHeading(startHeading, head, Math.min(1, t * 3)))
        if (t < 1) {
          this.animFrame = requestAnimationFrame(tick)
        } else {
          this.animFrame = 0
        }
      }

      this.animFrame = requestAnimationFrame(tick)
    }
  }

  return new BikeOverlay(position, heading, title)
}

function MapLegend({
  hasAgent,
  hasDropoff,
  routeSummary,
  routing,
}: {
  hasAgent: boolean
  hasDropoff: boolean
  routeSummary: RouteSummary | null
  routing: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-outline-variant/30 px-3 py-2 text-[11px] font-semibold text-on-surface-variant">
      {hasAgent ? (
        <span className="inline-flex items-center gap-1.5">
          <img src={scooterMarkerUrl} alt="" className="size-4 object-contain" />
          Courier
        </span>
      ) : null}
      {hasDropoff ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#22c55e]" />
          You
        </span>
      ) : null}
      {routeSummary?.durationText || routeSummary?.distanceText ? (
        <span className="inline-flex items-center gap-1.5 font-bold text-primary">
          <span className="material-symbols-outlined text-[14px]">route</span>
          {[routeSummary.durationText, routeSummary.distanceText].filter(Boolean).join(' · ')}
        </span>
      ) : routing && hasAgent && hasDropoff ? (
        <span className="font-medium">Finding road route…</span>
      ) : null}
      {!hasAgent && hasDropoff ? (
        <span className="font-medium">Waiting for live courier location…</span>
      ) : null}
    </div>
  )
}

function GoogleLiveTrackingMap({
  agent,
  dropoff,
  className,
  agentLabel,
  dropoffLabel,
}: {
  agent?: LatLng | null
  dropoff?: LatLng | null
  className?: string
  agentLabel: string
  dropoffLabel: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const bikeRef = useRef<BikeOverlayInstance | null>(null)
  const dropoffMarkerRef = useRef<google.maps.Marker | null>(null)
  const routeLineRef = useRef<google.maps.Polyline | null>(null)
  const routePathRef = useRef<LatLng[]>([])
  const bikeFractionRef = useRef(0)
  const lastAgentTargetRef = useRef<LatLng | null>(null)
  const lastDropoffRef = useRef<LatLng | null>(null)
  const hasFittedRef = useRef(false)
  const routingRef = useRef(false)
  const routeRequestIdRef = useRef(0)
  const agentLabelRef = useRef(agentLabel)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [routing, setRouting] = useState(false)
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null)

  agentLabelRef.current = agentLabel

  const hasAgent = Boolean(agent && Number.isFinite(agent.lat) && Number.isFinite(agent.lng))
  const hasDropoff = Boolean(dropoff && Number.isFinite(dropoff.lat) && Number.isFinite(dropoff.lng))

  const trimRemainingRoute = (position: LatLng) => {
    const fullPath = routePathRef.current
    const line = routeLineRef.current
    if (!line || fullPath.length < 2) return
    const { fraction } = projectOntoPath(fullPath, position)
    bikeFractionRef.current = Math.max(bikeFractionRef.current, fraction)
    const remaining = remainingPathFromFraction(fullPath, bikeFractionRef.current)
    if (remaining.length >= 1) line.setPath(remaining)
  }

  // Map boots once — never tear down on GPS updates.
  useEffect(() => {
    let cancelled = false
    let resizeObserver: ResizeObserver | null = null

    const init = async () => {
      try {
        await loadGoogleMaps()
      } catch {
        if (!cancelled) setLoadError(true)
        return
      }
      if (cancelled || !containerRef.current || mapRef.current) return

      const center = agent ?? dropoff ?? { lat: 20.5937, lng: 78.9629 }
      const map = new google.maps.Map(containerRef.current, {
        center,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
        gestureHandling: 'greedy',
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      mapRef.current = map
      setReady(true)

      resizeObserver = new ResizeObserver(() => {
        google.maps.event.trigger(map, 'resize')
      })
      resizeObserver.observe(containerRef.current)
    }

    void init()

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      bikeRef.current?.setMap(null)
      bikeRef.current = null
      dropoffMarkerRef.current?.setMap(null)
      dropoffMarkerRef.current = null
      routeLineRef.current?.setMap(null)
      routeLineRef.current = null
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drop-off pin — update in place, never remount map.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !hasDropoff || !dropoff) return

    if (!dropoffMarkerRef.current) {
      dropoffMarkerRef.current = new google.maps.Marker({
        map,
        position: dropoff,
        title: dropoffLabel,
        icon: youPinSvgIcon(),
        zIndex: 2,
      })
    } else if (!sameCoord(lastDropoffRef.current, dropoff)) {
      dropoffMarkerRef.current.setPosition(dropoff)
    }
    dropoffMarkerRef.current.setTitle(dropoffLabel)
  }, [ready, hasDropoff, dropoff, dropoffLabel])

  // Road route — fetch once, then only if drop-off moved or courier is far off-route.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !hasAgent || !hasDropoff || !agent || !dropoff) return

    const path = routePathRef.current
    const dropoffMoved =
      !lastDropoffRef.current ||
      haversineMeters(lastDropoffRef.current, dropoff) >= DROPOFF_CHANGE_METERS
    const offRoute =
      path.length >= 2 && projectOntoPath(path, agent).offlineMeters >= OFF_ROUTE_REROUTE_METERS
    const needRoute = path.length < 2 || dropoffMoved || offRoute

    if (!needRoute || routingRef.current) return

    const requestId = ++routeRequestIdRef.current
    routingRef.current = true
    setRouting(true)

    void (async () => {
      const road = await fetchRoadRoute(agent, dropoff)
      if (requestId !== routeRequestIdRef.current) return

      routingRef.current = false
      setRouting(false)

      if (!road?.path.length) return

      lastDropoffRef.current = dropoff
      routePathRef.current = road.path
      setRouteSummary({
        distanceText: road.distanceText,
        durationText: road.durationText,
      })

      if (!routeLineRef.current) {
        routeLineRef.current = new google.maps.Polyline({
          map,
          path: road.path,
          strokeColor: ROUTE_STROKE,
          strokeOpacity: 0.75,
          strokeWeight: ROUTE_WEIGHT,
          geodesic: false,
          zIndex: 1,
        })
      } else {
        routeLineRef.current.setPath(road.path)
      }

      // Fit camera only the first time — later GPS updates must not reframe the map.
      if (!hasFittedRef.current) {
        const bounds = new google.maps.LatLngBounds()
        for (const point of road.path) bounds.extend(point)
        map.fitBounds(bounds, 48)
        hasFittedRef.current = true
      }

      // Snap / place bike on the new path without cancelling a live travel anim harshly.
      const projection = projectOntoPath(road.path, agent)
      bikeFractionRef.current = projection.fraction
      if (routeLineRef.current) {
        routeLineRef.current.setPath(remainingPathFromFraction(road.path, projection.fraction))
      }
      if (!bikeRef.current) {
        const bike = createBikeOverlay(
          projection.point,
          projection.heading,
          agentLabelRef.current,
          trimRemainingRoute,
        )
        bike.setMap(map)
        bikeRef.current = bike
        lastAgentTargetRef.current = agent
      }
    })()
  }, [ready, hasAgent, hasDropoff, agent, dropoff])

  // Motorcycle only — smooth travel along the existing road path.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !hasAgent || !agent) return

    if (sameCoord(lastAgentTargetRef.current, agent, 1e-5)) return
    lastAgentTargetRef.current = agent

    const path = routePathRef.current
    const projection = path.length >= 2 ? projectOntoPath(path, agent) : null
    const nextPoint = projection?.point ?? agent
    const nextHeading = projection?.heading ?? 0
    const nextFraction = projection?.fraction ?? 0

    if (!bikeRef.current) {
      const bike = createBikeOverlay(
        nextPoint,
        nextHeading,
        agentLabelRef.current,
        trimRemainingRoute,
      )
      bike.setMap(map)
      bikeRef.current = bike
      bikeFractionRef.current = nextFraction
      trimRemainingRoute(nextPoint)
      return
    }

    bikeRef.current.setTitle(agentLabelRef.current)

    const from = bikeRef.current.position
    const duration = moveDurationMs(from, nextPoint)

    if (path.length >= 2) {
      // Only move forward along the route (ignore tiny GPS noise going backwards).
      const fromFraction = bikeFractionRef.current
      const targetFraction = Math.max(fromFraction, nextFraction)
      const samples = samplePathBetween(path, fromFraction, targetFraction)
      bikeRef.current.animateAlong(samples, duration)
      bikeFractionRef.current = targetFraction
    } else {
      bikeRef.current.animateAlong([from, nextPoint], duration)
    }
  }, [ready, hasAgent, agent])

  if (loadError) {
    return (
      <LeafletLiveTrackingMap
        agent={agent}
        dropoff={dropoff}
        className={className}
        agentLabel={agentLabel}
        dropoffLabel={dropoffLabel}
      />
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl bg-surface-container-low shadow-sm', className)}>
      <div ref={containerRef} className="h-56 w-full sm:h-72" />
      <MapLegend
        hasAgent={hasAgent}
        hasDropoff={hasDropoff}
        routeSummary={routeSummary}
        routing={routing}
      />
    </div>
  )
}

function LeafletLiveTrackingMap({
  agent,
  dropoff,
  className,
  agentLabel,
  dropoffLabel,
}: {
  agent?: LatLng | null
  dropoff?: LatLng | null
  className?: string
  agentLabel: string
  dropoffLabel: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const agentMarkerRef = useRef<L.Marker | null>(null)
  const dropoffMarkerRef = useRef<L.Marker | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)
  const routePathRef = useRef<LatLng[]>([])
  const bikeFractionRef = useRef(0)
  const lastAgentTargetRef = useRef<LatLng | null>(null)
  const lastDropoffRef = useRef<LatLng | null>(null)
  const hasFittedRef = useRef(false)
  const routingRef = useRef(false)
  const routeRequestIdRef = useRef(0)
  const animFrameRef = useRef(0)
  const [routing, setRouting] = useState(false)
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null)

  const hasAgent = Boolean(agent && Number.isFinite(agent.lat) && Number.isFinite(agent.lng))
  const hasDropoff = Boolean(dropoff && Number.isFinite(dropoff.lat) && Number.isFinite(dropoff.lng))

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center = agent ?? dropoff
    if (!center) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([center.lat, center.lng], 14)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map

    const resize = () => map.invalidateSize()
    window.setTimeout(resize, 80)
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trimRemainingRoute = (position: LatLng) => {
    const fullPath = routePathRef.current
    const line = lineRef.current
    if (!line || fullPath.length < 2) return
    const { fraction } = projectOntoPath(fullPath, position)
    bikeFractionRef.current = Math.max(bikeFractionRef.current, fraction)
    const remaining = remainingPathFromFraction(fullPath, bikeFractionRef.current)
    if (remaining.length >= 1) {
      line.setLatLngs(remaining.map((p) => [p.lat, p.lng] as L.LatLngExpression))
    }
  }

  const animateLeafletBike = (samples: LatLng[], durationMs: number) => {
    const marker = agentMarkerRef.current
    if (!marker || samples.length < 2) {
      if (marker && samples[0]) {
        marker.setLatLng([samples[0].lat, samples[0].lng])
        trimRemainingRoute(samples[0])
      }
      return
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    const { cum, total } = pathMetrics(samples)
    const start = performance.now()
    let startHeading = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const { point, heading } = pointAtDistance(samples, cum, total * t)
      if (t === 0) startHeading = heading
      marker.setLatLng([point.lat, point.lng])
      marker.setIcon(courierLeafletIcon(lerpHeading(startHeading, heading, Math.min(1, t * 3))))
      trimRemainingRoute(point)
      if (t < 1) animFrameRef.current = requestAnimationFrame(tick)
      else animFrameRef.current = 0
    }

    animFrameRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasDropoff || !dropoff) return

    if (!dropoffMarkerRef.current) {
      dropoffMarkerRef.current = L.marker([dropoff.lat, dropoff.lng], { icon: dropoffLeafletIcon() })
        .bindTooltip(dropoffLabel, { direction: 'top', offset: [0, -12] })
        .addTo(map)
    } else if (!sameCoord(lastDropoffRef.current, dropoff)) {
      dropoffMarkerRef.current.setLatLng([dropoff.lat, dropoff.lng])
    }
  }, [hasDropoff, dropoff, dropoffLabel])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasAgent || !hasDropoff || !agent || !dropoff) return

    const path = routePathRef.current
    const dropoffMoved =
      !lastDropoffRef.current ||
      haversineMeters(lastDropoffRef.current, dropoff) >= DROPOFF_CHANGE_METERS
    const offRoute =
      path.length >= 2 && projectOntoPath(path, agent).offlineMeters >= OFF_ROUTE_REROUTE_METERS
    if (!(path.length < 2 || dropoffMoved || offRoute) || routingRef.current) return

    const requestId = ++routeRequestIdRef.current
    routingRef.current = true
    setRouting(true)

    void (async () => {
      const road = await fetchRoadRoute(agent, dropoff)
      if (requestId !== routeRequestIdRef.current) return
      routingRef.current = false
      setRouting(false)
      if (!road?.path.length) return

      lastDropoffRef.current = dropoff
      routePathRef.current = road.path
      setRouteSummary({
        distanceText: road.distanceText,
        durationText: road.durationText,
      })

      const latLngs: L.LatLngExpression[] = road.path.map((p) => [p.lat, p.lng])
      if (!lineRef.current) {
        lineRef.current = L.polyline(latLngs, {
          color: ROUTE_STROKE,
          weight: ROUTE_WEIGHT,
          opacity: 0.75,
        }).addTo(map)
      } else {
        lineRef.current.setLatLngs(latLngs)
      }

      if (!hasFittedRef.current) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [48, 48], maxZoom: 15 })
        hasFittedRef.current = true
      }

      const projection = projectOntoPath(road.path, agent)
      bikeFractionRef.current = projection.fraction
      const remaining = remainingPathFromFraction(road.path, projection.fraction)
      if (lineRef.current) {
        lineRef.current.setLatLngs(remaining.map((p) => [p.lat, p.lng] as L.LatLngExpression))
      }
      if (!agentMarkerRef.current) {
        agentMarkerRef.current = L.marker([projection.point.lat, projection.point.lng], {
          icon: courierLeafletIcon(projection.heading),
          zIndexOffset: 600,
        })
          .bindTooltip(agentLabel, { direction: 'top', offset: [0, -14] })
          .addTo(map)
        lastAgentTargetRef.current = agent
      }
    })()
  }, [hasAgent, hasDropoff, agent, dropoff, agentLabel])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasAgent || !agent) return
    if (sameCoord(lastAgentTargetRef.current, agent, 1e-5)) return
    lastAgentTargetRef.current = agent

    const path = routePathRef.current
    const projection = path.length >= 2 ? projectOntoPath(path, agent) : null
    const next = projection?.point ?? agent
    const heading = projection?.heading ?? 0
    const nextFraction = projection?.fraction ?? 0

    if (!agentMarkerRef.current) {
      agentMarkerRef.current = L.marker([next.lat, next.lng], {
        icon: courierLeafletIcon(heading),
        zIndexOffset: 600,
      })
        .bindTooltip(agentLabel, { direction: 'top', offset: [0, -14] })
        .addTo(map)
      bikeFractionRef.current = nextFraction
      return
    }

    const cur = agentMarkerRef.current.getLatLng()
    const from = { lat: cur.lat, lng: cur.lng }
    const duration = moveDurationMs(from, next)

    if (path.length >= 2) {
      const fromFraction = bikeFractionRef.current
      const targetFraction = Math.max(fromFraction, nextFraction)
      animateLeafletBike(samplePathBetween(path, fromFraction, targetFraction), duration)
      bikeFractionRef.current = targetFraction
    } else {
      animateLeafletBike([from, next], duration)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAgent, agent, agentLabel])

  return (
    <div className={cn('overflow-hidden rounded-2xl bg-surface-container-low shadow-sm', className)}>
      <div ref={containerRef} className="h-56 w-full sm:h-72" />
      <MapLegend
        hasAgent={hasAgent}
        hasDropoff={hasDropoff}
        routeSummary={routeSummary}
        routing={routing}
      />
    </div>
  )
}

export function OrderLiveTrackingMap({
  agent,
  dropoff,
  className,
  agentLabel = 'Courier',
  dropoffLabel = 'You',
}: {
  agent?: LatLng | null
  dropoff?: LatLng | null
  className?: string
  agentLabel?: string
  dropoffLabel?: string
}) {
  // Keep last known courier GPS so brief poll gaps don't unmount the map.
  const stickyAgentRef = useRef<LatLng | null>(null)
  const stickyDropoffRef = useRef<LatLng | null>(null)

  if (agent && Number.isFinite(agent.lat) && Number.isFinite(agent.lng)) {
    stickyAgentRef.current = agent
  }
  if (dropoff && Number.isFinite(dropoff.lat) && Number.isFinite(dropoff.lng)) {
    stickyDropoffRef.current = dropoff
  }

  const displayAgent = agent ?? stickyAgentRef.current
  const displayDropoff = dropoff ?? stickyDropoffRef.current
  const hasAgent = Boolean(displayAgent)
  const hasDropoff = Boolean(displayDropoff)

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

  if (hasGoogleMapsApiKey()) {
    return (
      <GoogleLiveTrackingMap
        agent={displayAgent}
        dropoff={displayDropoff}
        className={className}
        agentLabel={agentLabel}
        dropoffLabel={dropoffLabel}
      />
    )
  }

  return (
    <LeafletLiveTrackingMap
      agent={displayAgent}
      dropoff={displayDropoff}
      className={className}
      agentLabel={agentLabel}
      dropoffLabel={dropoffLabel}
    />
  )
}
