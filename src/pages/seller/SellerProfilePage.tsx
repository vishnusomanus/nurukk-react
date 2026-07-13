import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage, isProfileNotFoundError } from '@/utils/apiErrorMessage'
import { getLogoutRedirectPath } from '@/utils/authPaths'
import { cn } from '@/utils/cn'

const PROFILE_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ9ckQZn0lT5D3bSUX7eM8UtAlvBN8BWRmE4txSfmfWbN5VWLGAdP1rLHT05BCuyrFoN6ITty1b7PxWBtWAyhoLQDY5oW3oaGwFCAPwFvxCPEu_479oV-od-Rykpnv1jdy7vMg8K68bFo_MQTZYu1KyYWCItZuvFgJGZecsQW5CjptmF7HjoT-kFIrSDJHTrI7Ck47VL5jSew4JjX45zM5VfZ43C5U_K6Cf3NS5R5SNziw4v7ZslCtnX7x_ylXuplppY7JHDr-yXPZ'

const MENU_LINKS = [
  { to: '/seller/inventory', label: 'Inventory', icon: 'warehouse', description: 'Stock levels' },
  { to: '/seller/recipes', label: 'Recipes', icon: 'menu_book', description: 'Farm-to-table dishes' },
  { to: '/seller/coupons', label: 'Coupons', icon: 'local_offer', description: 'Store offers' },
  { to: '/seller/payouts', label: 'Payouts', icon: 'payments', description: 'Earnings & transfers' },
  { to: '/seller/delivery', label: 'Delivery', icon: 'local_shipping', description: 'Radius & fees' },
  { to: '/seller/profile/edit', label: 'Edit profile', icon: 'edit', description: 'Farm details' },
  { to: '/seller/support', label: 'Help & Support', icon: 'help_center', description: 'Contact the team' },
] as const

function formatPhoneDisplay(phone?: string | null): string {
  const digits = String(phone ?? '').replace(/\D/g, '')
  const local = digits.length > 10 ? digits.slice(-10) : digits
  if (local.length !== 10) return phone ?? '—'
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
}

function sellerStatusLabel(status?: string): { label: string; verified: boolean } {
  switch (status) {
    case 'approved':
      return { label: 'Verified', verified: true }
    case 'pending':
      return { label: 'Pending', verified: false }
    case 'rejected':
      return { label: 'Rejected', verified: false }
    default:
      return { label: 'Seller', verified: false }
  }
}

const softCard =
  'rounded-2xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none'

export function SellerProfilePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logoutAuth = useAuth((s) => s.logout)

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => sellerService.getProfile(),
    retry: false,
  })

  const profileMissing = isError && isProfileNotFoundError(error)

  const { data: salesData } = useQuery({
    queryKey: ['seller', 'reports', 'month'],
    queryFn: () => sellerService.getSalesReport('month'),
    enabled: !isError,
  })

  const profile = data?.data
  const displayName = user?.name ?? 'Seller'
  const status = sellerStatusLabel(profile?.status)
  const place = [profile?.city, profile?.pincode].filter(Boolean).join(', ')
  const earnings = salesData?.data?.total_sales ?? 0

  const logout = async () => {
    const role = user?.role
    await logoutAuth()
    navigate(getLogoutRedirectPath('/seller', role), { replace: true })
  }

  if (isLoading) {
    return (
      <SellerPageShell pathname={location.pathname}>
        <div className="h-40 animate-pulse rounded-2xl bg-surface-container" />
        <div className="h-56 animate-pulse rounded-2xl bg-surface-container" />
      </SellerPageShell>
    )
  }

  if (isError && !profileMissing) {
    return (
      <SellerPageShell pathname={location.pathname}>
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(error, 'Failed to load profile')}
        </p>
      </SellerPageShell>
    )
  }

  return (
    <SellerPageShell pathname={location.pathname} className="space-y-3 lg:space-y-5">
      {profileMissing ? (
        <section className={cn(softCard, 'space-y-3 p-4 lg:p-5')}>
          <p className="text-sm text-on-surface-variant">
            Your farm store isn’t set up yet. Complete onboarding to start selling.
          </p>
          <Link
            to="/seller/onboarding"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary active:scale-[0.98]"
          >
            Set up store
          </Link>
        </section>
      ) : null}

      <section className={cn(softCard, 'overflow-hidden p-4 lg:p-5')}>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-container lg:h-20 lg:w-20">
            <RemoteImage src={PROFILE_AVATAR} alt={displayName} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-on-surface">{displayName}</h2>
              {!profileMissing ? (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                    status.verified
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-container-high text-on-surface-variant',
                  )}
                >
                  {status.label}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-on-surface-variant">
              {profile?.name || (profileMissing ? 'Store not set up' : 'Farm seller')}
              {place ? ` · ${place}` : ''}
            </p>
            <p className="mt-0.5 text-xs text-outline">
              {formatPhoneDisplay(profile?.phone ?? user?.phone)}
            </p>
          </div>
        </div>

        {!profileMissing ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-primary px-3 py-3 text-on-primary">
              <p className="text-[10px] font-bold tracking-wide uppercase opacity-80">This month</p>
              <p className="mt-0.5 text-base font-bold">{formatCurrency(earnings)}</p>
            </div>
            <Link
              to="/seller/profile/edit"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-low px-3 py-3 text-sm font-bold text-primary active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit profile
            </Link>
          </div>
        ) : null}
      </section>

      {!profileMissing ? (
        <section className={cn(softCard, 'overflow-hidden lg:hidden')}>
          {MENU_LINKS.map((item, index) => (
            <div key={item.to}>
              {index > 0 ? <div className="h-px bg-outline-variant/40" /> : null}
              <Link
                to={item.to}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-surface-container-low/60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-on-surface">{item.label}</span>
                  <span className="block text-xs text-on-surface-variant">{item.description}</span>
                </span>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </Link>
            </div>
          ))}
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => void logout()}
        className={cn(
          softCard,
          'flex w-full items-center gap-3 px-4 py-3.5 text-left text-error active:bg-error/5',
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[22px]">logout</span>
        </span>
        <span className="text-[15px] font-semibold">Log out</span>
      </button>
    </SellerPageShell>
  )
}
