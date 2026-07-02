import { useCallback, useEffect, useRef, useState } from 'react'
import type { BuyerAddress, BuyerAddressPayload } from '@/api/services/buyerService'
import { AddressMapPicker, type MapPosition } from '@/components/buyer/AddressMapPicker'
import { useAuthStore } from '@/store/authStore'
import { composeAddressLine, getAddressLine } from '@/utils/buyerAddress'
import { cn } from '@/utils/cn'
import {
  DEFAULT_MAP_CENTER,
  type GeocodedAddress,
  getCurrentPosition,
  reverseGeocode,
  searchLocations,
} from '@/utils/nominatim'

const LABEL_PRESETS = ['Home', 'Office', 'Gym', 'Other'] as const

const inputClassName =
  'text-body-md w-full rounded-xl border-none bg-surface-container-low px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary'

type AddressFormModalProps = {
  open: boolean
  onClose: () => void
  initial?: BuyerAddress | null
  saving?: boolean
  error?: string | null
  onSubmit: (payload: BuyerAddressPayload) => void
}

function readInitialPosition(address?: BuyerAddress | null): MapPosition {
  const lat = address?.latitude
  const lng = address?.longitude
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { lat, lng }
  }
  return DEFAULT_MAP_CENTER
}

export function AddressFormModal({
  open,
  onClose,
  initial,
  saving = false,
  error,
  onSubmit,
}: AddressFormModalProps) {
  const user = useAuthStore((s) => s.user)

  const [label, setLabel] = useState('Home')
  const [flatBuilding, setFlatBuilding] = useState('')
  const [city, setCity] = useState('')
  const [landmark, setLandmark] = useState('')
  const [pincode, setPincode] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [mapSearch, setMapSearch] = useState('')
  const [position, setPosition] = useState<MapPosition>(DEFAULT_MAP_CENTER)
  const [mapError, setMapError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)

  const geocodeTimerRef = useRef<number | null>(null)
  const geocodeRequestRef = useRef(0)

  const applyGeocodedAddress = useCallback((result: GeocodedAddress, overwrite = false) => {
    setPosition({ lat: result.lat, lng: result.lng })
    if (result.displayName) setMapSearch(result.displayName)
    if (result.addressLine) {
      setFlatBuilding((current) => (overwrite ? result.addressLine! : current || result.addressLine!))
    }
    if (result.city) {
      setCity((current) => (overwrite ? result.city! : current || result.city!))
    }
    if (result.pincode) {
      setPincode((current) => (overwrite ? result.pincode! : current || result.pincode!))
    }
  }, [])

  const runReverseGeocode = useCallback(
    async (coords: MapPosition, overwrite = false) => {
      const requestId = ++geocodeRequestRef.current
      setGeocoding(true)
      setMapError(null)
      try {
        const result = await reverseGeocode(coords.lat, coords.lng)
        if (requestId !== geocodeRequestRef.current) return
        applyGeocodedAddress(result, overwrite)
      } catch (err) {
        if (requestId !== geocodeRequestRef.current) return
        setMapError(err instanceof Error ? err.message : 'Could not resolve this location.')
      } finally {
        if (requestId === geocodeRequestRef.current) setGeocoding(false)
      }
    },
    [applyGeocodedAddress],
  )

  const scheduleReverseGeocode = useCallback(
    (coords: MapPosition, overwrite = false) => {
      if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current)
      geocodeTimerRef.current = window.setTimeout(() => {
        void runReverseGeocode(coords, overwrite)
      }, 600)
    },
    [runReverseGeocode],
  )

  useEffect(() => {
    if (!open) return

    const initialPosition = readInitialPosition(initial)
    setLabel(initial?.label ?? 'Home')
    setFlatBuilding(getAddressLine(initial ?? ({} as BuyerAddress)))
    setCity(initial?.city ?? '')
    setLandmark('')
    setPincode(initial?.pincode ?? '')
    setIsDefault(initial?.is_default ?? false)
    setMapSearch('')
    setMapError(null)
    setPosition(initialPosition)

    if (initial?.latitude != null && initial?.longitude != null) {
      void runReverseGeocode(initialPosition, false)
      return
    }

    let cancelled = false
    setLocating(true)

    void getCurrentPosition()
      .then((geo) => {
        if (cancelled) return
        const coords = { lat: geo.coords.latitude, lng: geo.coords.longitude }
        setPosition(coords)
        return runReverseGeocode(coords, true)
      })
      .catch(() => {
        if (cancelled) return
        void runReverseGeocode(initialPosition, false)
      })
      .finally(() => {
        if (!cancelled) setLocating(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, initial, runReverseGeocode])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
      if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current)
    }
  }, [open, onClose, saving])

  const handleMapPositionChange = (coords: MapPosition) => {
    setPosition(coords)
    scheduleReverseGeocode(coords, true)
  }

  const handleLocate = () => {
    setLocating(true)
    setMapError(null)
    void getCurrentPosition()
      .then((geo) => {
        const coords = { lat: geo.coords.latitude, lng: geo.coords.longitude }
        setPosition(coords)
        return runReverseGeocode(coords, true)
      })
      .catch((err) => {
        setMapError(err instanceof Error ? err.message : 'Unable to access your location.')
      })
      .finally(() => setLocating(false))
  }

  const handleSearchSubmit = () => {
    const query = mapSearch.trim()
    if (query.length < 3) {
      setMapError('Enter at least 3 characters to search.')
      return
    }

    setGeocoding(true)
    setMapError(null)
    void searchLocations(query)
      .then((results) => {
        const match = results[0]
        if (!match) {
          setMapError('No locations found. Try a different search.')
          return
        }
        applyGeocodedAddress(match, true)
      })
      .catch((err) => {
        setMapError(err instanceof Error ? err.message : 'Search failed.')
      })
      .finally(() => setGeocoding(false))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      label: label.trim(),
      address_line: composeAddressLine(flatBuilding, landmark),
      city: city.trim(),
      pincode: pincode.trim(),
      is_default: isDefault,
      latitude: position.lat,
      longitude: position.lng,
    })
  }

  if (!open) return null

  const title = initial ? 'Edit Address' : 'Add New Address'
  const displayName = user?.name?.trim() || ''
  const displayPhone = user?.phone?.trim() || ''

  const mapPanel = (
    <AddressMapPicker
      position={position}
      onPositionChange={handleMapPositionChange}
      searchQuery={mapSearch}
      onSearchQueryChange={setMapSearch}
      onSearchSubmit={handleSearchSubmit}
      onLocate={handleLocate}
      locating={locating}
      loading={geocoding}
      error={mapError}
      className="min-h-[280px] flex-1 md:min-h-0"
    />
  )

  return (
    <div
      className="stitch-address-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="presentation"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-form-title"
        className="stitch-address-modal-shadow flex max-h-[min(921px,calc(100vh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-surface-container-lowest md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 id="address-form-title" className="text-headline-lg text-on-surface">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="text-outline transition-colors hover:text-on-surface disabled:opacity-50"
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="mb-6 overflow-hidden rounded-xl border border-outline-variant/30 md:hidden">
            {mapPanel}
          </div>

          <form id="address-form" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-label-md text-on-surface-variant">Full Name</span>
                <input
                  value={displayName}
                  readOnly
                  placeholder="From your profile"
                  className={cn(inputClassName, 'text-on-surface-variant')}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-label-md text-on-surface-variant">Phone Number</span>
                <input
                  value={displayPhone}
                  readOnly
                  placeholder="From your profile"
                  className={cn(inputClassName, 'text-on-surface-variant')}
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-label-md text-on-surface-variant">Flat/House No., Building Name</span>
              <input
                value={flatBuilding}
                onChange={(e) => setFlatBuilding(e.target.value)}
                required
                maxLength={255}
                placeholder="e.g. Apt 4B, Verdant Towers"
                className={inputClassName}
              />
            </label>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-label-md text-on-surface-variant">Area, Sector, Locality</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="e.g. Downtown East"
                  className={inputClassName}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-label-md text-on-surface-variant">Pincode</span>
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="e.g. 560103"
                  className={inputClassName}
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-label-md text-on-surface-variant">Landmark (Optional)</span>
              <input
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                maxLength={120}
                placeholder="e.g. Near Central Park"
                className={inputClassName}
              />
            </label>

            <div className="space-y-3">
              <span className="text-label-md text-on-surface-variant">Address Label</span>
              <div className="flex flex-wrap gap-3">
                {LABEL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLabel(preset)}
                    className={cn(
                      'text-label-md rounded-full border px-6 py-1.5 transition-all active:scale-95',
                      label === preset
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline text-on-surface-variant hover:border-primary hover:text-primary',
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <label className="group flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-5 w-5 rounded border-outline text-primary focus:ring-primary"
              />
              <span className="text-body-md text-on-surface-variant transition-colors group-hover:text-on-surface">
                Set as Default Address
              </span>
            </label>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 pt-2 md:hidden">
              <button
                type="submit"
                disabled={saving}
                className="text-headline-lg w-full rounded-xl bg-primary py-4 font-bold text-on-primary transition-transform active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Address'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="text-headline-lg w-full rounded-xl bg-surface-variant py-4 font-bold text-on-surface-variant transition-transform active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="relative hidden w-full flex-col bg-surface-container md:flex md:w-[400px]">
          {mapPanel}
          <div className="relative z-20 flex gap-4 border-t border-outline-variant bg-surface-container-lowest p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="text-body-lg flex-1 rounded-xl bg-surface-variant py-3 font-bold text-on-surface-variant transition-colors hover:bg-surface-dim active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="address-form"
              disabled={saving}
              className="text-body-lg flex-1 rounded-xl bg-primary py-3 font-bold text-on-primary shadow-md transition-colors hover:bg-primary-container active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
