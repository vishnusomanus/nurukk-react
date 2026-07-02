import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { AddressMapPicker, type MapPosition } from '@/components/buyer/AddressMapPicker'
import type { DeliveryLocationMeta } from '@/context/DeliveryLocationProvider'
import type { DeliveryCheckResult } from '@/utils/deliveryCheck'
import { normalizeIndianPincode } from '@/utils/normalizeIndianPincode'
import {
  DEFAULT_MAP_CENTER,
  getCurrentPosition,
  reverseGeocode,
  searchLocations,
} from '@/utils/nominatim'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type DeliveryLocationMapSheetProps = {
  open: boolean
  onClose: () => void
  initialPosition?: MapPosition | null
  onConfirmed: (result: DeliveryCheckResult, meta: DeliveryLocationMeta) => void
}

export function DeliveryLocationMapSheet({
  open,
  onClose,
  initialPosition,
  onConfirmed,
}: DeliveryLocationMapSheetProps) {
  const [position, setPosition] = useState<MapPosition>(initialPosition ?? DEFAULT_MAP_CENTER)
  const [mapSearch, setMapSearch] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const geocodeTimerRef = useRef<number | null>(null)
  const geocodeRequestRef = useRef(0)

  useEffect(() => {
    if (!open) return
    setPosition(initialPosition ?? DEFAULT_MAP_CENTER)
    setMapError(null)
  }, [open, initialPosition])

  const runReverseGeocode = useCallback(async (coords: MapPosition) => {
    const requestId = ++geocodeRequestRef.current
    setGeocoding(true)
    setMapError(null)
    try {
      const result = await reverseGeocode(coords.lat, coords.lng)
      if (requestId !== geocodeRequestRef.current) return
      if (result.displayName) setMapSearch(result.displayName)
    } catch (err) {
      if (requestId === geocodeRequestRef.current) {
        setMapError(err instanceof Error ? err.message : 'Could not resolve address')
      }
    } finally {
      if (requestId === geocodeRequestRef.current) setGeocoding(false)
    }
  }, [])

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
        setMapError('No results found. Try a different search.')
        return
      }
      const coords = { lat: hit.lat, lng: hit.lng }
      setPosition(coords)
      if (hit.displayName) setMapSearch(hit.displayName)
    } catch (err) {
      setMapError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setGeocoding(false)
    }
  }, [mapSearch])

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const geo = await reverseGeocode(position.lat, position.lng)
      const pincode = normalizeIndianPincode(geo.pincode) || undefined
      const res = await buyerService.checkDeliveryLocation({
        latitude: position.lat,
        longitude: position.lng,
        pincode,
      })
      return {
        result: res.data ?? {},
        meta: {
          latitude: position.lat,
          longitude: position.lng,
          city: geo.city ?? res.data?.city ?? undefined,
          pincode: pincode ?? res.data?.pincode ?? undefined,
        } satisfies DeliveryLocationMeta,
      }
    },
    onSuccess: (data) => {
      onConfirmed(data.result, data.meta)
      onClose()
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div>
            <h3 className="text-body-lg font-bold text-on-surface">Set delivery location</h3>
            <p className="text-body-md text-on-surface-variant">Pin your exact location on the map</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <AddressMapPicker
          className="min-h-[320px] flex-1"
          position={position}
          onPositionChange={handlePositionChange}
          searchQuery={mapSearch}
          onSearchQueryChange={setMapSearch}
          onSearchSubmit={() => void handleSearchSubmit()}
          onLocate={() => void handleLocate()}
          locating={locating}
          loading={geocoding}
          error={mapError}
          pinHint="Move the map so the pin sits on your building or street."
        />

        <div className="space-y-2 border-t border-outline-variant p-4">
          {confirmMutation.isError ? (
            <p className="text-sm text-error">
              {getApiErrorMessage(confirmMutation.error, 'Could not confirm location')}
            </p>
          ) : null}
          <button
            type="button"
            disabled={confirmMutation.isPending || geocoding}
            onClick={() => confirmMutation.mutate()}
            className={cn(
              'text-label-md w-full rounded-xl bg-primary py-3 font-bold text-on-primary disabled:opacity-60',
            )}
          >
            {confirmMutation.isPending ? 'Checking stores near you…' : 'Confirm location'}
          </button>
          <p className="text-label-md text-center text-on-surface-variant">
            Only stores within delivery range of this pin will appear.
          </p>
        </div>
      </div>
    </div>
  )
}
