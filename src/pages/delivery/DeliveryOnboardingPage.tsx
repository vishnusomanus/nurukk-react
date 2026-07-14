import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

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
  const [displayName, setDisplayName] = useState(user?.name && user.name !== 'Delivery Agent' ? user.name : '')
  const [vehicleType, setVehicleType] = useState('')
  const [serviceRadius, setServiceRadius] = useState('10')

  if (user?.role === 'seller_delivery') {
    return <Navigate to="/delivery" replace />
  }

  if (user && user.role !== 'delivery_agent' && user.role !== 'buyer' && user.role !== 'customer') {
    return <Navigate to="/" replace />
  }

  const register = useMutation({
    mutationFn: () =>
      deliveryService.registerAgent({
        display_name: displayName.trim(),
        vehicle_type: vehicleType || undefined,
        service_radius_km: Number(serviceRadius) || 10,
      }),
    onSuccess: async () => {
      await initUser()
      navigate('/delivery', { replace: true })
    },
  })

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

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            register.mutate()
          }}
        >
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

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
              Service radius (km)
            </span>
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={serviceRadius}
              onChange={(e) => setServiceRadius(e.target.value)}
              className="h-12 w-full rounded-2xl border-none bg-surface-container-low px-4 text-[16px] text-on-surface outline-none focus:ring-2 focus:ring-primary/25"
            />
          </label>

          {register.isError ? (
            <p className="rounded-2xl bg-error-container/25 px-4 py-3 text-sm text-error">
              {getApiErrorMessage(register.error, 'Registration failed')}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={register.isPending || !displayName.trim()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-on-primary shadow-[0_12px_24px_-8px_rgba(13,99,27,0.5)] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {register.isPending ? 'Creating profile…' : 'Start delivering'}
          </button>
        </form>
      </div>
    </div>
  )
}
