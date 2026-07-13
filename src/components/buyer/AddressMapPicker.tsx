import { useEffect, useId, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/utils/cn'
import { hasGoogleMapsApiKey, loadGoogleMaps } from '@/utils/googleMapsLoader'
import { type GeocodedAddress, searchLocations } from '@/utils/nominatim'

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
  /** Called when the user picks a suggestion from the dropdown. */
  onPickLocation?: (result: GeocodedAddress) => void
  onLocate: () => void
  locating?: boolean
  loading?: boolean
  error?: string | null
  className?: string
  overlayClassName?: string
  /** When set, draws a delivery-radius circle around the pin (km). */
  radiusKm?: number
  pinHint?: string
  /** Compact chrome for full-screen / bottom-sheet map pickers. */
  variant?: 'default' | 'sheet'
}

const RADIUS_STYLE = {
  color: '#0d631b',
  weight: 2,
  fillColor: '#0d631b',
  fillOpacity: 0.12,
} as const

const GOOGLE_RADIUS_STYLE: google.maps.CircleOptions = {
  strokeColor: '#0d631b',
  strokeOpacity: 1,
  strokeWeight: 2,
  fillColor: '#0d631b',
  fillOpacity: 0.12,
  clickable: false,
}

/** ~5m — ignore float noise / resize-driven map idle updates */
const POSITION_EPS = 0.00005

function nearlySamePosition(a: MapPosition, b: MapPosition) {
  return Math.abs(a.lat - b.lat) < POSITION_EPS && Math.abs(a.lng - b.lng) < POSITION_EPS
}

export function AddressMapPicker({
  position,
  onPositionChange,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onPickLocation,
  onLocate,
  locating = false,
  loading = false,
  error,
  className,
  overlayClassName,
  radiusKm,
  pinHint = 'Drag the map to position the pin exactly on your delivery location.',
  variant = 'default',
}: AddressMapPickerProps) {
  const isSheet = variant === 'sheet'
  const listboxId = useId()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const leafletCircleRef = useRef<L.Circle | null>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const googleCircleRef = useRef<google.maps.Circle | null>(null)
  const googleIdleListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const ignoreMovesUntilRef = useRef(0)
  const lastEmittedRef = useRef<MapPosition | null>(null)
  const onPositionChangeRef = useRef(onPositionChange)
  const onPickLocationRef = useRef(onPickLocation)
  const onSearchSubmitRef = useRef(onSearchSubmit)
  const radiusKmRef = useRef(radiusKm)
  const searchRequestRef = useRef(0)
  const suppressSuggestionsRef = useRef(false)
  const useGoogle = hasGoogleMapsApiKey()

  const [suggestions, setSuggestions] = useState<GeocodedAddress[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [searchFocused, setSearchFocused] = useState(false)

  onPositionChangeRef.current = onPositionChange
  onPickLocationRef.current = onPickLocation
  onSearchSubmitRef.current = onSearchSubmit
  radiusKmRef.current = radiusKm

  useEffect(() => {
    if (!searchFocused || suppressSuggestionsRef.current) {
      setSuggestions([])
      setSuggestionsOpen(false)
      setHighlightIndex(-1)
      return
    }

    const query = searchQuery.trim()
    if (query.length < 3) {
      setSuggestions([])
      setSuggestionsOpen(false)
      setHighlightIndex(-1)
      setSuggestionsLoading(false)
      return
    }

    const requestId = ++searchRequestRef.current
    setSuggestionsLoading(true)
    const timer = window.setTimeout(() => {
      void searchLocations(query, 5)
        .then((results) => {
          if (requestId !== searchRequestRef.current) return
          setSuggestions(results)
          setSuggestionsOpen(results.length > 0)
          setHighlightIndex(results.length > 0 ? 0 : -1)
        })
        .catch(() => {
          if (requestId !== searchRequestRef.current) return
          setSuggestions([])
          setSuggestionsOpen(false)
          setHighlightIndex(-1)
        })
        .finally(() => {
          if (requestId === searchRequestRef.current) setSuggestionsLoading(false)
        })
    }, 320)

    return () => {
      window.clearTimeout(timer)
    }
  }, [searchQuery, searchFocused])

  const pickSuggestion = (result: GeocodedAddress) => {
    suppressSuggestionsRef.current = true
    searchRequestRef.current += 1
    setSuggestions([])
    setSuggestionsOpen(false)
    setHighlightIndex(-1)
    setSuggestionsLoading(false)
    if (onPickLocationRef.current) {
      onPickLocationRef.current(result)
    } else {
      onSearchSubmitRef.current()
    }
    window.setTimeout(() => {
      suppressSuggestionsRef.current = false
    }, 400)
  }

  const runSearch = () => {
    suppressSuggestionsRef.current = true
    searchRequestRef.current += 1
    setSuggestions([])
    setSuggestionsOpen(false)
    setHighlightIndex(-1)
    onSearchSubmitRef.current()
    window.setTimeout(() => {
      suppressSuggestionsRef.current = false
    }, 400)
  }

  const suppressNextMoves = (ms = 200) => {
    ignoreMovesUntilRef.current = Date.now() + ms
  }

  const shouldIgnoreMove = () => Date.now() < ignoreMovesUntilRef.current

  const emitPositionChange = (next: MapPosition) => {
    if (shouldIgnoreMove()) return
    const prev = lastEmittedRef.current
    if (prev && nearlySamePosition(prev, next)) return
    lastEmittedRef.current = next
    onPositionChangeRef.current(next)
  }

  const syncLeafletRadius = (map: L.Map) => {
    const km = radiusKmRef.current
    if (km == null || km <= 0) {
      leafletCircleRef.current?.remove()
      leafletCircleRef.current = null
      return
    }

    const center = map.getCenter()
    const radiusMeters = km * 1000

    if (leafletCircleRef.current) {
      leafletCircleRef.current.setLatLng(center)
      leafletCircleRef.current.setRadius(radiusMeters)
      return
    }

    leafletCircleRef.current = L.circle(center, {
      ...RADIUS_STYLE,
      radius: radiusMeters,
      interactive: false,
    }).addTo(map)
  }

  const fitLeafletRadius = (map: L.Map) => {
    const circle = leafletCircleRef.current
    if (!circle) return
    map.fitBounds(circle.getBounds(), {
      padding: [56, 56],
      animate: true,
      maxZoom: 16,
    })
  }

  const syncGoogleRadius = (map: google.maps.Map) => {
    const km = radiusKmRef.current
    const center = map.getCenter()
    if (!center || km == null || km <= 0) {
      googleCircleRef.current?.setMap(null)
      googleCircleRef.current = null
      return
    }

    const radiusMeters = km * 1000
    if (googleCircleRef.current) {
      googleCircleRef.current.setCenter(center)
      googleCircleRef.current.setRadius(radiusMeters)
      return
    }

    googleCircleRef.current = new google.maps.Circle({
      ...GOOGLE_RADIUS_STYLE,
      map,
      center,
      radius: radiusMeters,
    })
  }

  const fitGoogleRadius = (map: google.maps.Map) => {
    const circle = googleCircleRef.current
    if (!circle) return
    const bounds = circle.getBounds()
    if (bounds) map.fitBounds(bounds, 56)
  }

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let cancelled = false
    let resizeObserver: ResizeObserver | null = null

    const initLeaflet = () => {
      if (cancelled || leafletMapRef.current) return

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

      const handleMapMove = () => syncLeafletRadius(map)
      map.on('move', handleMapMove)
      map.on('zoom', handleMapMove)
      map.on('moveend', () => {
        syncLeafletRadius(map)
        if (shouldIgnoreMove()) return
        const center = map.getCenter()
        emitPositionChange({ lat: center.lat, lng: center.lng })
      })

      leafletMapRef.current = map
      lastEmittedRef.current = { lat: position.lat, lng: position.lng }
      resizeObserver = new ResizeObserver(() => {
        suppressNextMoves()
        map.invalidateSize({ animate: false })
        syncLeafletRadius(map)
      })
      resizeObserver.observe(container)

      map.whenReady(() => {
        requestAnimationFrame(() => {
          suppressNextMoves()
          map.invalidateSize({ animate: false })
          syncLeafletRadius(map)
          if (radiusKmRef.current != null && radiusKmRef.current > 0) fitLeafletRadius(map)
        })
      })
      window.setTimeout(() => {
        suppressNextMoves()
        map.invalidateSize({ animate: false })
      }, 150)
    }

    const initGoogle = async () => {
      try {
        await loadGoogleMaps()
      } catch {
        if (!cancelled) initLeaflet()
        return
      }
      if (cancelled || googleMapRef.current || !mapContainerRef.current) return

      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: position.lat, lng: position.lng },
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },
        gestureHandling: 'greedy',
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      googleIdleListenerRef.current = map.addListener('idle', () => {
        syncGoogleRadius(map)
        if (shouldIgnoreMove()) return
        const center = map.getCenter()
        if (!center) return
        emitPositionChange({ lat: center.lat(), lng: center.lng() })
      })

      googleMapRef.current = map
      lastEmittedRef.current = { lat: position.lat, lng: position.lng }
      syncGoogleRadius(map)
      if (radiusKmRef.current != null && radiusKmRef.current > 0) fitGoogleRadius(map)

      resizeObserver = new ResizeObserver(() => {
        suppressNextMoves()
        google.maps.event.trigger(map, 'resize')
        syncGoogleRadius(map)
      })
      resizeObserver.observe(mapContainerRef.current)
    }

    if (useGoogle) {
      void initGoogle()
    } else {
      initLeaflet()
    }

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      if (googleIdleListenerRef.current) {
        google.maps.event.removeListener(googleIdleListenerRef.current)
        googleIdleListenerRef.current = null
      }
      googleCircleRef.current?.setMap(null)
      googleCircleRef.current = null
      googleMapRef.current = null

      leafletCircleRef.current?.remove()
      leafletCircleRef.current = null
      leafletMapRef.current?.remove()
      leafletMapRef.current = null
    }
    // Initialize once; position/radius synced in later effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useGoogle])

  useEffect(() => {
    const leafletMap = leafletMapRef.current
    if (leafletMap) {
      const center = leafletMap.getCenter()
      if (nearlySamePosition({ lat: center.lat, lng: center.lng }, position)) return

      suppressNextMoves()
      lastEmittedRef.current = position
      leafletMap.setView([position.lat, position.lng], leafletMap.getZoom(), { animate: false })
      if (radiusKmRef.current != null && radiusKmRef.current > 0) {
        syncLeafletRadius(leafletMap)
        fitLeafletRadius(leafletMap)
      }
      return
    }

    const googleMap = googleMapRef.current
    if (!googleMap) return

    const center = googleMap.getCenter()
    if (center && nearlySamePosition({ lat: center.lat(), lng: center.lng() }, position)) {
      return
    }

    suppressNextMoves()
    lastEmittedRef.current = position
    googleMap.panTo({ lat: position.lat, lng: position.lng })
    if (radiusKmRef.current != null && radiusKmRef.current > 0) {
      google.maps.event.addListenerOnce(googleMap, 'idle', () => {
        syncGoogleRadius(googleMap)
        fitGoogleRadius(googleMap)
      })
    }
  }, [position.lat, position.lng])

  useEffect(() => {
    const leafletMap = leafletMapRef.current
    if (leafletMap) {
      syncLeafletRadius(leafletMap)
      if (radiusKm != null && radiusKm > 0) {
        fitLeafletRadius(leafletMap)
      } else {
        leafletCircleRef.current?.remove()
        leafletCircleRef.current = null
      }
      return
    }

    const googleMap = googleMapRef.current
    if (!googleMap) return
    syncGoogleRadius(googleMap)
    if (radiusKm != null && radiusKm > 0) {
      fitGoogleRadius(googleMap)
    } else {
      googleCircleRef.current?.setMap(null)
      googleCircleRef.current = null
    }
  }, [radiusKm])

  return (
    <div
      className={cn(
        'relative flex flex-col bg-surface-container',
        isSheet ? 'min-h-0 flex-1' : 'min-h-[280px]',
        className,
      )}
    >
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

      <div
        className={cn(
          'pointer-events-none relative z-20 flex h-full flex-col justify-between',
          isSheet ? 'min-h-0 p-3' : 'min-h-[280px] p-4 md:p-6',
        )}
      >
        <div className="pointer-events-auto relative">
          <div
            className={cn(
              'flex items-center gap-2 border border-black/10 bg-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.28)] [color-scheme:light]',
              isSheet ? 'rounded-full px-4 py-2.5' : 'rounded-xl p-3 backdrop-blur-xl',
            )}
          >
            <span className="material-symbols-outlined shrink-0 text-[#0d631b]">search</span>
            <input
              value={searchQuery}
              onChange={(e) => {
                suppressSuggestionsRef.current = false
                onSearchQueryChange(e.target.value)
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setSearchFocused(false), 150)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  if (suggestionsOpen && suggestions.length > 0) {
                    const index = highlightIndex >= 0 ? highlightIndex : 0
                    pickSuggestion(suggestions[index]!)
                    return
                  }
                  runSearch()
                  return
                }
                if (e.key === 'ArrowDown' && suggestionsOpen && suggestions.length > 0) {
                  e.preventDefault()
                  setHighlightIndex((i) => (i + 1) % suggestions.length)
                  return
                }
                if (e.key === 'ArrowUp' && suggestionsOpen && suggestions.length > 0) {
                  e.preventDefault()
                  setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
                  return
                }
                if (e.key === 'Escape' && suggestionsOpen) {
                  e.preventDefault()
                  e.stopPropagation()
                  setSuggestionsOpen(false)
                  setHighlightIndex(-1)
                }
              }}
              placeholder="Search area, landmark, pincode…"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              role="combobox"
              aria-expanded={suggestionsOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                suggestionsOpen && highlightIndex >= 0
                  ? `${listboxId}-option-${highlightIndex}`
                  : undefined
              }
              className="w-full border-none bg-transparent text-[16px] leading-5 text-[#1b1c1c] outline-none placeholder:text-[#6b7568] placeholder:opacity-100 focus:ring-0"
            />
            {loading || suggestionsLoading ? (
              <span className="material-symbols-outlined animate-spin text-[20px] text-[#0d631b]">
                progress_activity
              </span>
            ) : null}
          </div>

          {suggestionsOpen && suggestions.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute top-[calc(100%+0.4rem)] left-0 right-0 z-30 max-h-56 overflow-y-auto rounded-2xl border border-black/10 bg-white py-1 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.35)] [color-scheme:light]"
            >
              {suggestions.map((result, index) => {
                const label = result.displayName ?? result.addressLine ?? 'Location'
                const active = index === highlightIndex
                return (
                  <li key={`${result.lat}-${result.lng}-${label}`} role="presentation">
                    <button
                      id={`${listboxId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setHighlightIndex(index)}
                      onClick={() => pickSuggestion(result)}
                      className={cn(
                        'flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                        active ? 'bg-primary/10 text-on-surface' : 'text-on-surface hover:bg-black/[0.04]',
                      )}
                    >
                      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary">
                        location_on
                      </span>
                      <span className="line-clamp-2 leading-snug">{label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        <div className={cn('pointer-events-none flex flex-col', isSheet ? 'items-end gap-2' : 'gap-3')}>
          <button
            type="button"
            onClick={onLocate}
            disabled={locating}
            className={cn(
              'pointer-events-auto flex shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-[0_8px_20px_-6px_rgba(15,23,42,0.35)] transition-transform active:scale-90 disabled:opacity-60',
              isSheet ? 'size-12' : 'h-12 w-12 self-end hover:bg-primary hover:text-on-primary',
            )}
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

          {!isSheet ? (
            <div className="pointer-events-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest/90 p-4 shadow-sm backdrop-blur-md">
              <p className="text-label-md mb-1 text-primary">{radiusKm ? 'STORE LOCATION' : 'ADJUST PIN'}</p>
              <p className="text-body-md leading-tight text-on-surface-variant">{pinHint}</p>
              {error ? <p className="text-body-md mt-2 text-error">{error}</p> : null}
            </div>
          ) : error ? (
            <div className="pointer-events-auto max-w-[min(100%,18rem)] rounded-2xl bg-white/95 px-3 py-2 text-sm text-error shadow-md backdrop-blur-md">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
