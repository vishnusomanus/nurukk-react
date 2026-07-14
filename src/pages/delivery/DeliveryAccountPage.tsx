import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { deliveryService } from '@/api/services'
import { DeliveryPageShell } from '@/components/delivery/DeliveryPageShell'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { getLogoutRedirectPath } from '@/utils/authPaths'
import { cn } from '@/utils/cn'

export function DeliveryAccountPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useAuth((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const userRole = user?.role

  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery', 'profile'],
    queryFn: () => deliveryService.getProfile(),
    retry: false,
  })

  const profile = data?.data

  const toggleAvailability = useMutation({
    mutationFn: (is_available: boolean) => deliveryService.updateProfile({ is_available }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['delivery', 'profile'] })
    },
  })

  const available = profile?.is_available !== false

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
