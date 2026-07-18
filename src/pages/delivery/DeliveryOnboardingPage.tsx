import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage, getApiFieldErrorMap } from '@/utils/apiErrorMessage'
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
]

export function DeliveryOnboardingPage() {
  const navigate = useNavigate()
  const initUser = useAuth((s) => s.initUser)
  const user = useAuthStore((s) => s.user)
  const [displayName, setDisplayName] = useState(
    user?.name && user.name !== 'Delivery Agent' ? user.name : '',
  )
  const [vehicleType, setVehicleType] = useState('')
  const [serviceRadius, setServiceRadius] = useState(String(SERVICE_RADIUS_DEFAULT_KM))
  const [showRadiusError, setShowRadiusError] = useState(false)

  const radiusError = useMemo(() => validateServiceRadiusKm(serviceRadius), [serviceRadius])

  const register = useMutation({
    mutationFn: () => {
      const radius = parseServiceRadiusKm(serviceRadius)
      const message = validateServiceRadiusKm(serviceRadius)
      if (radius == null || message) {
        throw Object.assign(new Error(message ?? 'Invalid radius'), { localValidation: true })
      }
      return deliveryService.registerAgent({
        display_name: displayName.trim(),
        vehicle_type: vehicleType || undefined,
        service_radius_km: radius,
      })
    },
    onSuccess: async () => {
      await initUser()
      navigate('/delivery', { replace: true })
    },
  })

  if (user?.role === 'seller_delivery') {
    return <Navigate to="/delivery" replace />
  }

  if (user && user.role !== 'delivery_agent' && user.role !== 'buyer' && user.role !== 'customer') {
    return <Navigate to="/" replace />
  }

  const apiRadiusError = register.isError
    ? (getApiFieldErrorMap(register.error).service_radius_km ??
      (register.error instanceof Error &&
      (register.error as { localValidation?: boolean }).localValidation
        ? register.error.message
        : null))
    : null
  const shownRadiusError = showRadiusError || apiRadiusError ? radiusError ?? apiRadiusError : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (radiusError) {
      setShowRadiusError(true)
      return
    }
    register.mutate()
  }

  return (
    <div className="stitch-auth-page stitch-body stitch-login-bg relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="stitch-login-overlay pointer-events-none fixed inset-0" aria-hidden />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] bg-surface/95 p-6 shadow-[0_20px_50px_-20px_rgba(15,40,20,0.35)] backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo size="md" className="mb-4 h-16" />
          <h1 className="text-2xl font-bold tracking-tight text-primary">Ready to ride</h1>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            A few details before you can accept marketplace deliveries.
          </p>
        </div>

        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
              Full name
            </span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name as shown to customers"
              className="h-12 w-full rounded-2xl border-none bg-surface-container-low px-4 text-[16px] text-on-surface outline-none ring-0 placeholder:text-outline focus:ring-2 focus:ring-primary/25"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
              Vehicle
            </span>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="h-12 w-full rounded-2xl border-none bg-surface-container-low px-4 text-[16px] text-on-surface outline-none focus:ring-2 focus:ring-primary/25"
            >
              {VEHICLE_OPTIONS.map((option) => (
                <option key={option.value || 'none'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <label className="block" htmlFor="onboarding-service-radius">
              <span className="mb-1.5 block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                Service radius (km)
              </span>
              <input
                id="onboarding-service-radius"
                type="number"
                inputMode="decimal"
                min={SERVICE_RADIUS_MIN_KM}
                max={SERVICE_RADIUS_MAX_KM}
                step={0.5}
                value={serviceRadius}
                aria-invalid={shownRadiusError ? true : undefined}
                aria-describedby="onboarding-service-radius-hint onboarding-service-radius-error"
                onChange={(e) => {
                  setServiceRadius(e.target.value)
                  setShowRadiusError(true)
                  register.reset()
                }}
                onBlur={() => setShowRadiusError(true)}
                className={cn(
                  'h-12 w-full rounded-2xl border-none bg-surface-container-low px-4 text-[16px] text-on-surface outline-none focus:ring-2 focus:ring-primary/25',
                  shownRadiusError && 'ring-2 ring-error/40 focus:ring-error/50',
                )}
              />
            </label>
            <p
              id="onboarding-service-radius-hint"
              className="mt-1.5 text-xs leading-relaxed text-on-surface-variant"
            >
              {SERVICE_RADIUS_HINT}
            </p>
            {shownRadiusError ? (
              <p id="onboarding-service-radius-error" className="mt-1.5 text-sm text-error" role="alert">
                {shownRadiusError}
              </p>
            ) : null}
          </div>

          {register.isError && !apiRadiusError ? (
            <p className="rounded-2xl bg-error-container/25 px-4 py-3 text-sm text-error">
              {getApiErrorMessage(register.error, 'Registration failed')}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={register.isPending || !displayName.trim() || !!radiusError}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-on-primary shadow-[0_12px_24px_-8px_rgba(13,99,27,0.5)] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {register.isPending ? 'Creating profile…' : 'Start delivering'}
          </button>
        </form>
      </div>
    </div>
  )
}
