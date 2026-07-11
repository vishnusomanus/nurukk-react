import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { BuyerAccountShell } from '@/components/buyer/BuyerAccountShell'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { extractRows } from '@/utils/extractRows'
import { formatCurrency } from '@/utils/formatCurrency'
import { useOrderSavingsSummary } from '@/utils/buyerAccount'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { getHomePathForRole, isSellerRole } from '@/utils/authRole'
import { allowsRoleSwitch } from '@/config/appRole'
import { canSwitchToSeller } from '@/utils/sellerAccess'
import { cn } from '@/utils/cn'

const PROFILE_HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAPHHilKMhyQ-cKgzDa5dN75fiGREeqQOnqBt44VYIrd-SFyRtTb_zntTe9K7e9iTmrZomyhcohWlD6CBctAsx0HQWQp7V59E5SkFykr647WKn59v5OwE_dwtgZY6eYbutcaPyi0PyRlRC2lgu2HGSBdJ9NTr2zN_aep14su-MdLNPoW13Xby3L7kCT9Acq2wyU8FkInrnTV2UNiM1nwjM6hKnNwcrqPx2ao-vYTOaEGfQKgKX9vaJCP0etBwQUcFZzokTtJuwmZ-A2'

const PROFILE_AVATAR_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDP6pHoFxWdjIImPbkOMU-UgazhB4QukSXXA-eCEN5Hr-RBWkwLNfNfTfHAW-wE0VzEXlbbMah6Vp7_O06Cds3qcQqNQ3PvagD1n9zwfUR5fqSUUqAUQVKL3PwVVKVtT2Wy09neJP09IDiqtMZ4qYmPQxpa0-36jFtmq-z8k2yl6ZS5pOGLY7SkoMdByejP0K4i3oudUhCG49X-9xfyFeLEr4oAwEeZWZeSO2wLFH97gZgHwmCsZ_3XG52tjzNeyjNt_6pAQCX1sBFV'

const MANAGEMENT_CARDS = [
  {
    icon: 'person',
    iconWrap: 'bg-primary-fixed',
    iconColor: 'text-on-primary-fixed',
    title: 'Personal Information',
    description: 'Update your name, bio, and public profile details.',
    to: '/buyer/profile/personal',
  },
  {
    icon: 'home_pin',
    iconWrap: 'bg-tertiary-fixed',
    iconColor: 'text-on-tertiary-fixed',
    title: 'Saved Addresses',
    description: 'Manage your primary delivery locations and farm pickups.',
    to: '/buyer/addresses',
  },
  {
    icon: 'payments',
    iconWrap: 'bg-secondary-fixed',
    iconColor: 'text-on-secondary-fixed',
    title: 'Payment Methods',
    description: 'Securely edit or add your credit cards and digital wallets.',
  },
  {
    icon: 'receipt_long',
    iconWrap: 'bg-primary-fixed',
    iconColor: 'text-on-primary-fixed',
    title: 'Order History',
    description: 'View your past boxes, subscriptions, and reorder favorites.',
    to: '/buyer/orders',
  },
  {
    icon: 'notifications_active',
    iconWrap: 'bg-surface-container-highest',
    iconColor: 'text-on-surface',
    title: 'Notifications',
    description: 'View order updates, delivery alerts, and past notifications.',
    to: '/buyer/notifications',
  },
  {
    icon: 'help_center',
    iconWrap: 'bg-tertiary-fixed',
    iconColor: 'text-on-tertiary-fixed',
    title: 'Help & Support',
    description: 'Get assistance from our team or browse the FAQ.',
  },
] as const

function ProfileManagementCard({
  icon,
  iconWrap,
  iconColor,
  title,
  description,
  to,
}: {
  icon: string
  iconWrap: string
  iconColor: string
  title: string
  description: string
  to?: string
}) {
  const className =
    'stitch-glass-card stitch-card-shadow group rounded-xl p-6 text-left transition-all hover:shadow-lg active:scale-[0.98] lg:p-8'

  const content = (
    <>
      <div
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
          iconWrap,
        )}
      >
        <span className={cn('material-symbols-outlined', iconColor)}>{icon}</span>
      </div>
      <h3 className="text-[20px] font-bold text-on-surface">{title}</h3>
      <p className="text-body-md mt-2 text-on-surface-variant">{description}</p>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={className}>
      {content}
    </button>
  )
}

function ProfileSellerModeToggle({
  canSell,
  sellerMode,
  isPending,
  errorMessage,
  onToggle,
}: {
  canSell: boolean
  sellerMode: boolean
  isPending: boolean
  errorMessage?: string | null
  onToggle: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary">storefront</span>
          <div>
            <p className="text-label-md text-on-surface">Seller Mode</p>
            <p
              className={cn(
                'text-[10px] font-bold uppercase',
                sellerMode ? 'text-secondary' : 'text-outline',
              )}
            >
              {isPending ? 'Switching…' : sellerMode ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!canSell || isPending}
          onClick={onToggle}
          aria-pressed={sellerMode}
          className={cn(
            'relative ml-4 h-6 w-12 shrink-0 rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
            sellerMode ? 'bg-secondary' : 'bg-outline-variant',
          )}
        >
          <span
            className={cn(
              'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform duration-300',
              sellerMode ? 'left-7' : 'left-1',
            )}
          />
        </button>
      </div>
      {!canSell ? (
        <p className="text-body-md text-outline">Seller access is not enabled for this account.</p>
      ) : null}
      {errorMessage ? <p className="text-sm text-error">{errorMessage}</p> : null}
    </div>
  )
}

function DashboardContent({
  firstName,
  canSell,
  sellerMode,
  toggleSellerMode,
  switchPending,
  switchError,
  logout,
  totalSavings,
  orderCount,
}: {
  firstName: string
  canSell: boolean
  sellerMode: boolean
  toggleSellerMode: () => void
  switchPending: boolean
  switchError?: string | null
  logout: () => void
  totalSavings: number
  orderCount: number
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-headline-xl text-on-surface">Welcome back, {firstName}</h1>
        <p className="text-body-lg text-on-surface-variant">Your fresh harvest is waiting for you.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="stitch-card-shadow rounded-xl border border-outline-variant/30 bg-primary-container p-5 text-on-primary-container">
          <p className="text-label-md tracking-wider opacity-80 uppercase">Total Savings</p>
          <p className="text-headline-lg mt-1">{formatCurrency(totalSavings)}</p>
        </div>
        <div className="stitch-card-shadow rounded-xl border border-outline-variant/30 bg-tertiary-container/10 p-5">
          <p className="text-label-md tracking-wider text-on-surface-variant uppercase">Orders</p>
          <p className="text-headline-lg mt-1 text-tertiary-container">{orderCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
        {MANAGEMENT_CARDS.map((card) => (
          <ProfileManagementCard key={card.title} {...card} />
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-primary-container p-6 text-on-primary-container">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-headline-lg">eco</span>
          <div>
            <p className="text-[18px] font-bold">Sustainability Impact</p>
            <p className="text-body-md mt-1">
              You&apos;ve supported 14 local farms and saved 22kg of CO2 this month.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {canSell ? (
            <div className="min-w-0 flex-1">
              <ProfileSellerModeToggle
                canSell={canSell}
                sellerMode={sellerMode}
                isPending={switchPending}
                errorMessage={switchError}
                onToggle={toggleSellerMode}
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void logout()}
            className="text-label-md flex items-center gap-2 rounded-lg border border-error px-4 py-2 text-error transition-all hover:bg-error hover:text-white active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </div>
    </>
  )
}

export function BuyerProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const initUser = useAuth((s) => s.initUser)
  const switchRole = useAuth((s) => s.switchRole)

  const displayName = user?.name?.trim() || 'Guest'
  const firstName = displayName.split(/\s+/)[0] ?? displayName
  const canSell = allowsRoleSwitch() && canSwitchToSeller(user)
  const sellerMode = isSellerRole(user?.role)

  const switchRoleMutation = useMutation({
    mutationFn: (nextRole: 'buyer' | 'seller') => switchRole(nextRole),
    onSuccess: (_user, nextRole) => {
      navigate(getHomePathForRole(nextRole))
    },
  })

  const { data: ordersData } = useQuery({
    queryKey: ['buyer', 'orders', 'profile-summary'],
    queryFn: () => buyerService.listOrders({ page: 1, per_page: 50 }),
  })

  const orders = useMemo(
    () => extractRows(ordersData?.data) as import('@/api/services/buyerService').BuyerOrder[],
    [ordersData?.data],
  )
  const { savings } = useOrderSavingsSummary(orders)

  useEffect(() => {
    void initUser()
  }, [initUser])

  const toggleSellerMode = () => {
    if (!canSell || switchRoleMutation.isPending) return
    const nextRole: 'buyer' | 'seller' = sellerMode ? 'buyer' : 'seller'
    switchRoleMutation.mutate(nextRole)
  }

  const switchError = switchRoleMutation.isError
    ? getApiErrorMessage(switchRoleMutation.error, 'Could not switch to seller mode')
    : null

  const sharedProps = {
    firstName,
    canSell,
    sellerMode,
    toggleSellerMode,
    switchPending: switchRoleMutation.isPending,
    switchError,
    logout,
    totalSavings: savings,
    orderCount: orders.length,
  }

  return (
    <>
      <div className="lg:hidden">
        <div className="app-page-pad-bottom">
          <BuyerPageHeader title="Profile" showBack={false} />
          <main className="app-page-pad-top buyer-page-container space-y-8 lg:space-y-10">
            <section className="relative mb-2 h-40 overflow-hidden rounded-xl shadow-sm">
              <RemoteImage
                priority
                src={PROFILE_HERO_IMAGE}
                alt=""
                className="absolute inset-0 z-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-primary/40 to-transparent" />
              <div className="absolute bottom-4 left-4 z-20">
                <h1 className="text-headline-xl text-white drop-shadow-md">Welcome back, {firstName}</h1>
                <p className="text-body-lg text-white/90">Your fresh harvest is waiting for you.</p>
              </div>
            </section>

            <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary-fixed p-1">
                  <div className="h-24 w-24 overflow-hidden rounded-full">
                    <RemoteImage
                      src={PROFILE_AVATAR_IMAGE}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <h2 className="text-headline-lg text-on-surface">{displayName}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {MANAGEMENT_CARDS.map((card) => (
                <ProfileManagementCard key={card.title} {...card} />
              ))}
            </div>

            {canSell ? (
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
                <ProfileSellerModeToggle
                  canSell={canSell}
                  sellerMode={sellerMode}
                  isPending={switchRoleMutation.isPending}
                  errorMessage={switchError}
                  onToggle={toggleSellerMode}
                />
              </div>
            ) : null}

            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
              <button
                type="button"
                onClick={() => void logout()}
                className="text-label-md flex w-full items-center justify-center gap-2 rounded-lg border border-error px-4 py-2 text-error"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          </main>
        </div>
      </div>

      <div className="hidden lg:block">
        <BuyerAccountShell title="Profile" showBack={false}>
          <DashboardContent {...sharedProps} />
        </BuyerAccountShell>
      </div>
    </>
  )
}
