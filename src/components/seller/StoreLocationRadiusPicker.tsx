import { useCallback, useEffect, useRef, useState } from 'react'
import { AddressMapPicker, type MapPosition } from '@/components/buyer/AddressMapPicker'
import {
  DEFAULT_MAP_CENTER,
  getCurrentPosition,
  reverseGeocode,
  searchLocations,
} from '@/utils/nominatim'
import { cn } from '@/utils/cn'

type StoreLocationRadiusPickerProps = {
  latitude: number | null
  longitude: number | null
  radiusKm: number
  maxRadiusKm: number
  addressLine?: string
  onLocationChange: (payload: { latitude: number; longitude: number; addressLine?: string }) => void
  onRadiusChange: (radiusKm: number) => void
  className?: string
}

export function StoreLocationRadiusPicker({
  latitude,
  longitude,
  radiusKm,
  maxRadiusKm,
  addressLine,
  onLocationChange,
  onRadiusChange,
  className,
}: StoreLocationRadiusPickerProps) {
  const [position, setPosition] = useState<MapPosition>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : DEFAULT_MAP_CENTER,
  )
  const [mapSearch, setMapSearch] = useState(addressLine ?? '')
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const geocodeTimerRef = useRef<number | null>(null)
  const geocodeRequestRef = useRef(0)

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setPosition({ lat: latitude, lng: longitude })
    }
  }, [latitude, longitude])

  useEffect(() => {
    if (addressLine) setMapSearch(addressLine)
  }, [addressLine])

  const emitLocation = useCallback(
    async (coords: MapPosition, resolvedAddress?: string) => {
      onLocationChange({
        latitude: coords.lat,
        longitude: coords.lng,
        addressLine: resolvedAddress,
      })
    },
    [onLocationChange],
  )

  const runReverseGeocode = useCallback(
    async (coords: MapPosition) => {
      const requestId = ++geocodeRequestRef.current
      setGeocoding(true)
      setMapError(null)
      try {
        const result = await reverseGeocode(coords.lat, coords.lng)
        if (requestId !== geocodeRequestRef.current) return
        const line = result.displayName ?? result.addressLine
        if (line) setMapSearch(line)
        await emitLocation(coords, line)
      } catch (err) {
        if (requestId === geocodeRequestRef.current) {
          setMapError(err instanceof Error ? err.message : 'Could not resolve address')
          await emitLocation(coords)
        }
      } finally {
        if (requestId === geocodeRequestRef.current) setGeocoding(false)
      }
    },
    [emitLocation],
  )

  const handlePositionChange = useCallback(
    (coords: MapPosition) => {
      setPosition(coords)
      if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current)
      geocodeTimerRef.current = window.setTimeout(() => {
        void runReverseGeocode(coords)
      }, 450)
    },
    [runReverseGeocode],
  )

  const handleLocate = useCallback(async () => {
    setLocating(true)
    setMapError(null)
    try {
      const pos = await getCurrentPosition()
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setPosition(coords)
      await runReverseGeocode(coords)
    } catch (err) {
      setMapError(err instanceof Error ? err.message : 'Could not get your location')
    } finally {
      setLocating(false)
    }
  }, [runReverseGeocode])

  const handleSearchSubmit = useCallback(async () => {
    const query = mapSearch.trim()
    if (query.length < 3) return
    setGeocoding(true)
    setMapError(null)
    try {
      const results = await searchLocations(query, 1)
      const hit = results[0]
      if (!hit) {
        setMapError('No results found.')
        return
      }
      const coords = { lat: hit.lat, lng: hit.lng }
      setPosition(coords)
      if (hit.displayName) setMapSearch(hit.displayName)
      await emitLocation(coords, hit.displayName ?? hit.addressLine)
    } catch (err) {
      setMapError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setGeocoding(false)
    }
  }, [emitLocation, mapSearch])

  const sliderMax = Math.min(Math.max(maxRadiusKm, 1), 100)

  return (
    <div className={cn('space-y-4', className)}>
      <AddressMapPicker
        className="min-h-[300px] overflow-hidden rounded-xl"
        position={position}
        onPositionChange={handlePositionChange}
        searchQuery={mapSearch}
        onSearchQueryChange={setMapSearch}
        onSearchSubmit={() => void handleSearchSubmit()}
        onPickLocation={(hit) => {
          const coords = { lat: hit.lat, lng: hit.lng }
          setPosition(coords)
          if (hit.displayName) setMapSearch(hit.displayName)
          setMapError(null)
          void emitLocation(coords, hit.displayName ?? hit.addressLine)
        }}
        onLocate={() => void handleLocate()}
        locating={locating}
        loading={geocoding}
        error={mapError}
        radiusKm={radiusKm}
        pinHint="Pin your farm/store on the map. The circle shows how far you deliver."
      />

      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="delivery-radius" className="text-label-md font-bold text-on-surface">
            Delivery radius
          </label>
          <span className="text-body-md font-semibold text-primary">{radiusKm.toFixed(1)} km</span>
        </div>
        <input
          id="delivery-radius"
          type="range"
          min={1}
          max={sliderMax}
          step={0.5}
          value={Math.min(radiusKm, sliderMax)}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <p className="text-label-md mt-2 text-on-surface-variant">
          Buyers within this circle can order when you offer own delivery. Platform max is {maxRadiusKm} km.
        </p>
      </div>

      {latitude == null || longitude == null ? (
        <p className="text-body-md rounded-lg bg-tertiary-container/20 px-3 py-2 text-on-surface-variant">
          Set your store pin on the map to enable geo-based delivery.
        </p>
      ) : null}
    </div>
  )
}
