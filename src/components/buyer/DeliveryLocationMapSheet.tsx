import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { AddressMapPicker, type MapPosition } from '@/components/buyer/AddressMapPicker'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import type { DeliveryLocationMeta } from '@/context/DeliveryLocationProvider'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'
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

const POSITION_EPS = 0.00005

function nearlySamePosition(a: MapPosition, b: MapPosition) {
  return Math.abs(a.lat - b.lat) < POSITION_EPS && Math.abs(a.lng - b.lng) < POSITION_EPS
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
  const lastGeocodedRef = useRef<MapPosition | null>(null)
  const initialPositionRef = useRef(initialPosition)
  const onCloseRef = useRef(onClose)

  initialPositionRef.current = initialPosition
  onCloseRef.current = onClose

  const { handleProps, sheetStyle } = useSwipeToClose(onClose, { enabled: open })

  // Reset state only when the sheet opens — avoid loops from unstable parent props.
  useEffect(() => {
    if (!open) return

    const start = initialPositionRef.current ?? DEFAULT_MAP_CENTER
    setPosition(start)
    setMapSearch('')
    setMapError(null)
    setGeocoding(false)
    setLocating(false)
    lastGeocodedRef.current = null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
      if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current)
    }
  }, [open])

  const runReverseGeocode = useCallback(async (coords: MapPosition) => {
    const prev = lastGeocodedRef.current
    if (prev && nearlySamePosition(prev, coords)) return

    const requestId = ++geocodeRequestRef.current
    lastGeocodedRef.current = coords
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
      setPosition((prev) => (nearlySamePosition(prev, coords) ? prev : coords))
      if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current)
      geocodeTimerRef.current = window.setTimeout(() => {
        void runReverseGeocode(coords)
      }, 500)
    },
    [runReverseGeocode],
  )

  const handleLocate = useCallback(async () => {
    setLocating(true)
    setMapError(null)
    try {
      const pos = await getCurrentPosition()
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      lastGeocodedRef.current = null
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
      lastGeocodedRef.current = null
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

  const addressPreview = mapSearch.trim() || 'Move the map to set your delivery pin'

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Set delivery location"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />

      <div
        className="relative z-10 flex h-[min(94dvh,920px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-surface shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.35)] sm:mb-6 sm:h-[min(88dvh,820px)] sm:rounded-[1.75rem]"
        style={sheetStyle}
      >
        <div className="relative z-20 shrink-0 bg-surface px-4 pt-1 pb-2">
          <BottomSheetHandle {...handleProps} />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-transform active:scale-95"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div className="min-w-0 flex-1 touch-none" {...handleProps}>
              <h3 className="text-base font-bold text-on-surface">Set delivery location</h3>
              <p className="truncate text-xs text-on-surface-variant">
                Drag the map so the pin sits on your building
              </p>
            </div>
          </div>
        </div>

        <AddressMapPicker
          variant="sheet"
          className="min-h-0 flex-1"
          position={position}
          onPositionChange={handlePositionChange}
          searchQuery={mapSearch}
          onSearchQueryChange={setMapSearch}
          onSearchSubmit={() => void handleSearchSubmit()}
          onLocate={() => void handleLocate()}
          locating={locating}
          loading={geocoding}
          error={mapError}
        />

        <div className="relative z-20 shrink-0 border-t border-black/[0.06] bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 flex min-h-[3.25rem] items-start gap-3">
            <span
              className="material-symbols-outlined mt-0.5 text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-wide text-on-surface-variant uppercase">
                Delivering to
              </p>
              <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-on-surface">
                {geocoding && !mapSearch.trim() ? 'Finding address…' : addressPreview}
              </p>
            </div>
          </div>

          {confirmMutation.isError ? (
            <p className="mb-2 text-sm text-error">
              {getApiErrorMessage(confirmMutation.error, 'Could not confirm location')}
            </p>
          ) : null}

          <button
            type="button"
            disabled={confirmMutation.isPending || geocoding}
            onClick={() => confirmMutation.mutate()}
            className={cn(
              'flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60',
            )}
          >
            {confirmMutation.isPending ? 'Checking stores near you…' : 'Confirm location'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
