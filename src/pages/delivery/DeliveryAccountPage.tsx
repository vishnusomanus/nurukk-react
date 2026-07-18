import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { deliveryService } from '@/api/services'
import { DeliveryPageShell } from '@/components/delivery/DeliveryPageShell'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage, getApiFieldErrorMap } from '@/utils/apiErrorMessage'
import { getLogoutRedirectPath } from '@/utils/authPaths'
import { cn } from '@/utils/cn'
import {
  SERVICE_RADIUS_DEFAULT_KM,
  SERVICE_RADIUS_HINT,
  SERVICE_RADIUS_MAX_KM,
  SERVICE_RADIUS_MIN_KM,
  parseServiceRadiusKm,
  validateServiceRadiusKm,
} from '@/utils/serviceRadius'

const VEHICLE_OPTIONS = [
  { value: '', label: 'Select vehicle (optional)' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
] as const

function fieldClassName() {
  return 'h-12 w-full rounded-2xl border-none bg-surface-container-low px-4 text-[16px] text-on-surface outline-none ring-0 placeholder:text-outline focus:ring-2 focus:ring-primary/25'
}

export function DeliveryAccountPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useAuth((s) => s.logout)
  const initUser = useAuth((s) => s.initUser)
  const user = useAuthStore((s) => s.user)
  const userRole = user?.role

  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery', 'profile'],
    queryFn: () => deliveryService.getProfile(),
    retry: false,
  })

  const profile = data?.data

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [serviceRadius, setServiceRadius] = useState(String(SERVICE_RADIUS_DEFAULT_KM))
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showRadiusError, setShowRadiusError] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? user?.name ?? '')
    setPhone(profile.phone ?? user?.phone ?? '')
    setVehicleType(profile.vehicle_type ?? '')
    setServiceRadius(
      profile.service_radius_km != null
        ? String(profile.service_radius_km)
        : String(SERVICE_RADIUS_DEFAULT_KM),
    )
    setLatitude(profile.latitude != null ? String(profile.latitude) : '')
    setLongitude(profile.longitude != null ? String(profile.longitude) : '')
    setShowRadiusError(false)
  }, [profile, user?.name, user?.phone])

  const radiusError = useMemo(() => validateServiceRadiusKm(serviceRadius), [serviceRadius])

  const toggleAvailability = useMutation({
    mutationFn: (is_available: boolean) => deliveryService.updateProfile({ is_available }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['delivery', 'profile'] })
    },
  })

  const saveProfile = useMutation({
    mutationFn: () => {
      const radius = parseServiceRadiusKm(serviceRadius)
      if (radius == null || validateServiceRadiusKm(serviceRadius)) {
        throw Object.assign(new Error(validateServiceRadiusKm(serviceRadius) ?? 'Invalid radius'), {
          localValidation: true,
        })
      }
      const lat = latitude.trim() === '' ? null : Number(latitude)
      const lng = longitude.trim() === '' ? null : Number(longitude)

      return deliveryService.updateProfile({
        display_name: displayName.trim(),
        phone: phone.trim() || null,
        vehicle_type: vehicleType || null,
        service_radius_km: radius,
        latitude: lat != null && Number.isFinite(lat) ? lat : null,
        longitude: lng != null && Number.isFinite(lng) ? lng : null,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['delivery', 'profile'] })
      await initUser()
      setSaveMessage('Profile saved.')
      setShowRadiusError(false)
      window.setTimeout(() => setSaveMessage(null), 2500)
    },
  })

  const available = profile?.is_available !== false

  const isDirty = useMemo(() => {
    if (!profile) return false
    const baselineRadius =
      profile.service_radius_km != null
        ? String(profile.service_radius_km)
        : String(SERVICE_RADIUS_DEFAULT_KM)
    const baselineLat = profile.latitude != null ? String(profile.latitude) : ''
    const baselineLng = profile.longitude != null ? String(profile.longitude) : ''
    return (
      displayName.trim() !== (profile.display_name ?? '').trim() ||
      phone.trim() !== (profile.phone ?? '').trim() ||
      vehicleType !== (profile.vehicle_type ?? '') ||
      serviceRadius !== baselineRadius ||
      latitude !== baselineLat ||
      longitude !== baselineLng
    )
  }, [displayName, latitude, longitude, phone, profile, serviceRadius, vehicleType])

  const apiRadiusError = saveProfile.isError
    ? (getApiFieldErrorMap(saveProfile.error).service_radius_km ??
      (saveProfile.error instanceof Error &&
      (saveProfile.error as { localValidation?: boolean }).localValidation
        ? saveProfile.error.message
        : null))
    : null
  const shownRadiusError = showRadiusError || apiRadiusError ? radiusError ?? apiRadiusError : null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (radiusError) {
      setShowRadiusError(true)
      return
    }
    saveProfile.mutate()
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location is not supported on this device.')
      return
    }
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(Number(position.coords.latitude.toFixed(6))))
        setLongitude(String(Number(position.coords.longitude.toFixed(6))))
        setLocating(false)
      },
      (err) => {
        setLocationError(err.message || 'Could not get your location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 20000 },
    )
  }

  return (
    <DeliveryPageShell pathname="/delivery/account" className="space-y-5">
      <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary to-primary-container p-5 text-on-primary shadow-[0_12px_28px_-10px_rgba(13,99,27,0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-80">Courier</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              {profile?.display_name || user?.name || 'Delivery agent'}
            </h2>
            <p className="mt-1 text-sm text-on-primary/85">
              {profile?.type === 'seller_employee' ? 'Store rider' : 'Platform agent'}
              {profile?.vehicle_type ? ` · ${String(profile.vehicle_type)}` : ''}
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-sm">
            <BrandLogo size="sm" className="h-9 brightness-0 invert" alt="" />
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Could not load profile')}
        </p>
      ) : null}

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-on-surface">Available for deliveries</p>
            <p className="text-body-md mt-0.5 text-on-surface-variant">
              Turn off when you are offline or on break.
            </p>
          </div>
          <button
            type="button"
            disabled={isLoading || toggleAvailability.isPending || !profile}
            onClick={() => toggleAvailability.mutate(!available)}
            className={cn(
              'relative h-8 w-14 shrink-0 rounded-full transition-colors',
              available ? 'bg-primary' : 'bg-outline-variant',
            )}
            aria-pressed={available}
            aria-label={available ? 'Set unavailable' : 'Set available'}
          >
            <span
              className={cn(
                'absolute top-1 size-6 rounded-full bg-white shadow transition-transform',
                available ? 'left-7' : 'left-1',
              )}
            />
          </button>
        </div>
        {toggleAvailability.isError ? (
          <p className="mt-3 text-sm text-error">
            {getApiErrorMessage(toggleAvailability.error, 'Could not update availability')}
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] sm:p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-on-surface">Profile details</h3>
          <p className="text-body-md mt-0.5 text-on-surface-variant">
            Keep your contact and service info up to date.
          </p>
        </div>

        {isLoading && !profile ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-surface-container-low" />
            ))}
          </div>
        ) : (
          <form className="space-y-4" noValidate onSubmit={handleSave}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                Full name
              </span>
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Name shown to customers"
                className={fieldClassName()}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                Phone
              </span>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile number"
                className={fieldClassName()}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                Vehicle
              </span>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className={fieldClassName()}
              >
                {VEHICLE_OPTIONS.map((option) => (
                  <option key={option.value || 'none'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <label className="block" htmlFor="delivery-service-radius">
                <span className="mb-1.5 block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                  Service radius (km)
                </span>
                <input
                  id="delivery-service-radius"
                  type="number"
                  inputMode="decimal"
                  min={SERVICE_RADIUS_MIN_KM}
                  max={SERVICE_RADIUS_MAX_KM}
                  step={0.5}
                  value={serviceRadius}
                  aria-invalid={shownRadiusError ? true : undefined}
                  aria-describedby="delivery-service-radius-hint delivery-service-radius-error"
                  onChange={(e) => {
                    setServiceRadius(e.target.value)
                    setShowRadiusError(true)
                    saveProfile.reset()
                  }}
                  onBlur={() => setShowRadiusError(true)}
                  className={cn(
                    fieldClassName(),
                    shownRadiusError && 'ring-2 ring-error/40 focus:ring-error/50',
                  )}
                />
              </label>
              <p
                id="delivery-service-radius-hint"
                className="mt-1.5 text-xs leading-relaxed text-on-surface-variant"
              >
                {SERVICE_RADIUS_HINT}
              </p>
              {shownRadiusError ? (
                <p id="delivery-service-radius-error" className="mt-1.5 text-sm text-error" role="alert">
                  {shownRadiusError}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                  Current location
                </span>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
                >
                  <span className={cn('material-symbols-outlined text-[16px]', locating && 'animate-spin')}>
                    my_location
                  </span>
                  {locating ? 'Detecting…' : 'Use GPS'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="sr-only">Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitude"
                    className={fieldClassName()}
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitude"
                    className={fieldClassName()}
                  />
                </label>
              </div>
              {locationError ? <p className="mt-2 text-sm text-error">{locationError}</p> : null}
            </div>

            {saveProfile.isError && !apiRadiusError ? (
              <p className="rounded-2xl bg-error-container/25 px-4 py-3 text-sm text-error">
                {getApiErrorMessage(saveProfile.error, 'Could not save profile')}
              </p>
            ) : null}
            {saveMessage ? (
              <p className="rounded-2xl bg-primary-container/30 px-4 py-3 text-sm font-medium text-primary">
                {saveMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                !profile || saveProfile.isPending || !displayName.trim() || !isDirty || !!radiusError
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-on-primary shadow-[0_12px_24px_-8px_rgba(13,99,27,0.5)] transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {saveProfile.isPending ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        )}
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface shadow-[0_2px_12px_rgba(15,40,20,0.06)]">
        <button
          type="button"
          onClick={async () => {
            await logout()
            navigate(getLogoutRedirectPath('/delivery', userRole), { replace: true })
          }}
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors active:bg-error-container/20"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-error-container/30 text-error">
            <span className="material-symbols-outlined">logout</span>
          </span>
          <span>
            <span className="block text-sm font-bold text-error">Log out</span>
            <span className="text-body-md text-on-surface-variant">Sign out of this device</span>
          </span>
        </button>
      </section>
    </DeliveryPageShell>
  )
}
