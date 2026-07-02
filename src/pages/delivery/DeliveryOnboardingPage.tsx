import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
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
    <div className="stitch-auth-page flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-outline-variant/40 bg-surface p-8 stitch-card-shadow">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/20 text-primary">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div>
            <h1 className="text-headline-xl text-on-surface">Complete your agent profile</h1>
            <p className="text-body-md text-on-surface-variant">
              A few details before you can accept marketplace deliveries.
            </p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            register.mutate()
          }}
        >
          <label className="block">
            <span className="text-label-md mb-1 block text-on-surface">Full name</span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name as shown to customers"
              className="text-body-md w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block">
            <span className="text-label-md mb-1 block text-on-surface">Vehicle type</span>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="text-body-md w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {VEHICLE_OPTIONS.map((option) => (
                <option key={option.value || 'none'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-label-md mb-1 block text-on-surface">Service radius (km)</span>
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={serviceRadius}
              onChange={(e) => setServiceRadius(e.target.value)}
              className="text-body-md w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {register.isError ? (
            <p className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm text-error">
              {getApiErrorMessage(register.error, 'Registration failed')}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={register.isPending || !displayName.trim()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-label-md font-bold text-on-primary transition-all hover:brightness-110 disabled:opacity-60"
          >
            {register.isPending ? 'Creating profile…' : 'Start delivering'}
          </button>
        </form>
      </div>
    </div>
  )
}
