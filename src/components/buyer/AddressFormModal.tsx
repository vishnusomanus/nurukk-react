import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BuyerAddress, BuyerAddressPayload } from '@/api/services/buyerService'
import { AddressMapPicker, type MapPosition } from '@/components/buyer/AddressMapPicker'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import { useAuth } from '@/hooks/useAuth'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
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
  'w-full rounded-xl border-none bg-surface-container-low px-3.5 py-3 text-[16px] text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary'

function splitPhone(phone?: string | null) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length <= 10) return digits
  if (digits.startsWith('91') && digits.length > 10) return digits.slice(-10)
  return digits.slice(-10)
}

function buildPhone(number: string) {
  const digits = number.replace(/\D/g, '').slice(0, 10)
  if (!digits) return null
  return `+91${digits}`
}

function normalizePhone(phone?: string | null) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length > 10 ? digits.slice(-10) : digits
}

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
  const updateAuthProfile = useAuth((s) => s.updateProfile)

  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [label, setLabel] = useState('Home')
  const [flatBuilding, setFlatBuilding] = useState('')
  const [city, setCity] = useState('')
  const [landmark, setLandmark] = useState('')
  const [pincode, setPincode] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [mapSearch, setMapSearch] = useState('')
  const [position, setPosition] = useState<MapPosition>(DEFAULT_MAP_CENTER)
  const [mapError, setMapError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const geocodeTimerRef = useRef<number | null>(null)
  const geocodeRequestRef = useRef(0)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const busy = saving || savingProfile

  const closeIfIdle = useCallback(() => {
    if (!busy) onCloseRef.current()
  }, [busy])

  const { handleProps, sheetStyle } = useSwipeToClose(closeIfIdle, { enabled: open && !busy })

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
    setContactName(user?.name?.trim() ?? '')
    setContactPhone(splitPhone(user?.phone))
    setLabel(initial?.label ?? 'Home')
    setFlatBuilding(getAddressLine(initial ?? ({} as BuyerAddress)))
    setCity(initial?.city ?? '')
    setLandmark('')
    setPincode(initial?.pincode ?? '')
    setIsDefault(initial?.is_default ?? false)
    setMapSearch('')
    setMapError(null)
    setProfileError(null)
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
      if (e.key === 'Escape' && !busy) onCloseRef.current()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
      if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current)
    }
  }, [open, busy])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return

    const nextName = contactName.trim()
    const nextPhone = buildPhone(contactPhone)
    const nameChanged = nextName !== (user?.name?.trim() ?? '')
    const phoneChanged = normalizePhone(nextPhone) !== normalizePhone(user?.phone)

    if (nameChanged || phoneChanged) {
      if (!nextName) {
        setProfileError('Enter a name for delivery.')
        return
      }
      if (!nextPhone || normalizePhone(nextPhone).length !== 10) {
        setProfileError('Enter a valid 10-digit phone number.')
        return
      }
      setSavingProfile(true)
      setProfileError(null)
      try {
        await updateAuthProfile({
          name: nextName,
          phone: nextPhone,
        })
      } catch (err) {
        setProfileError(getApiErrorMessage(err, 'Could not update name or phone'))
        setSavingProfile(false)
        return
      }
      setSavingProfile(false)
    }

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

  const title = initial ? 'Edit address' : 'Add address'

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={closeIfIdle}
      />

      <div
        className="relative z-10 flex h-[min(96dvh,920px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-surface shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.35)] lg:h-[min(90dvh,860px)] lg:max-w-3xl lg:rounded-[1.75rem] lg:shadow-2xl"
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-20 shrink-0 bg-surface px-4 pt-1 pb-2 lg:px-5">
          <div className="lg:hidden">
            <BottomSheetHandle {...handleProps} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeIfIdle}
              disabled={busy}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-transform active:scale-95 disabled:opacity-50"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
            <div className="min-w-0 flex-1 touch-none lg:pointer-events-none" {...handleProps}>
              <h2 id="address-form-title" className="text-base font-bold text-on-surface lg:text-lg">
                {title}
              </h2>
              <p className="truncate text-xs text-on-surface-variant">
                Pin the map, then fill in the details
              </p>
            </div>
          </div>
        </div>

        <form
          id="address-form"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
        >
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="relative h-[38dvh] shrink-0 overflow-hidden lg:h-auto lg:min-h-0 lg:w-[46%] lg:flex-none lg:self-stretch">
              <AddressMapPicker
                variant="sheet"
                className="!absolute inset-0 h-full min-h-0 !flex-none"
                position={position}
                onPositionChange={handleMapPositionChange}
                searchQuery={mapSearch}
                onSearchQueryChange={setMapSearch}
                onSearchSubmit={handleSearchSubmit}
                onLocate={handleLocate}
                locating={locating}
                loading={geocoding}
                error={mapError}
                pinHint="Drag the map to place the pin on your building."
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 lg:px-5 lg:py-4">
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold tracking-wide text-outline uppercase">
                      Full name
                    </span>
                    <input
                      value={contactName}
                      onChange={(e) => {
                        setContactName(e.target.value)
                        setProfileError(null)
                      }}
                      required
                      maxLength={120}
                      autoComplete="name"
                      placeholder="Recipient name"
                      className={inputClassName}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold tracking-wide text-outline uppercase">
                      Phone number
                    </span>
                    <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3.5 focus-within:ring-2 focus-within:ring-primary">
                      <span className="shrink-0 text-[16px] font-semibold text-on-surface-variant">
                        +91
                      </span>
                      <input
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                          setProfileError(null)
                        }}
                        required
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        className="w-full border-none bg-transparent py-3 text-[16px] text-on-surface outline-none placeholder:text-outline focus:ring-0"
                      />
                    </div>
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold tracking-wide text-outline uppercase">
                    Flat / House / Building
                  </span>
                  <input
                    value={flatBuilding}
                    onChange={(e) => setFlatBuilding(e.target.value)}
                    required
                    maxLength={255}
                    placeholder="e.g. Apt 4B, Verdant Towers"
                    className={inputClassName}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold tracking-wide text-outline uppercase">
                      Area / City
                    </span>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      maxLength={100}
                      placeholder="Locality"
                      className={inputClassName}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold tracking-wide text-outline uppercase">
                      Pincode
                    </span>
                    <input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="560103"
                      className={inputClassName}
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold tracking-wide text-outline uppercase">
                    Landmark <span className="normal-case tracking-normal text-outline/80">(optional)</span>
                  </span>
                  <input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    maxLength={120}
                    placeholder="Near Central Park"
                    className={inputClassName}
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold tracking-wide text-outline uppercase">
                    Save as
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {LABEL_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setLabel(preset)}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-bold transition-transform active:scale-95',
                          label === preset
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-low text-on-surface-variant',
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDefault((value) => !value)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors',
                    isDefault ? 'bg-primary/10' : 'bg-surface-container-low/80',
                  )}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined text-[22px]',
                      isDefault ? 'text-primary' : 'text-outline',
                    )}
                    style={isDefault ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    star
                  </span>
                  <span className="flex-1 text-sm font-semibold text-on-surface">
                    Set as default address
                  </span>
                  <span
                    className={cn(
                      'flex h-6 w-10 items-center rounded-full px-0.5 transition-colors',
                      isDefault ? 'bg-primary' : 'bg-outline-variant',
                    )}
                  >
                    <span
                      className={cn(
                        'size-5 rounded-full bg-white shadow transition-transform',
                        isDefault ? 'translate-x-4' : 'translate-x-0',
                      )}
                    />
                  </span>
                </button>

                {profileError || error ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                    {profileError || error}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative z-20 shrink-0 border-t border-black/[0.06] bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-5">
            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? 'Saving…' : initial ? 'Update address' : 'Save address'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
