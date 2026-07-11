import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { APP_NAME } from '@/constants/app'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { getHomePathForRole, isSellerRole } from '@/utils/authRole'
import { allowsRoleSwitch } from '@/config/appRole'
import { hasDualMarketplaceRoles } from '@/utils/sellerAccess'
import { cn } from '@/utils/cn'

type NavItem = {
  to: string
  label: string
  icon: string
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/seller', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/seller/products', label: 'Products', icon: 'inventory_2' },
  { to: '/seller/inventory', label: 'Inventory', icon: 'warehouse' },
  { to: '/seller/orders', label: 'Order History', icon: 'receipt_long' },
  { to: '/seller/coupons', label: 'Coupons', icon: 'local_offer' },
  { to: '/seller/payouts', label: 'Payouts', icon: 'payments' },
  { to: '/seller/delivery', label: 'Delivery', icon: 'local_shipping' },
  { to: '/seller/profile', label: 'Settings', icon: 'settings' },
]

type SellerSidebarProps = {
  mobileOpen?: boolean
  onClose?: () => void
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)
  const switchRole = useAuth((s) => s.switchRole)
  const user = useAuthStore((s) => s.user)
  const displayName = user?.name ?? user?.phone ?? 'Seller'
  const sellerMode = isSellerRole(user?.role)
  const showRoleSwitch = allowsRoleSwitch() && hasDualMarketplaceRoles(user)

  const switchRoleMutation = useMutation({
    mutationFn: (nextRole: 'buyer' | 'seller') => switchRole(nextRole),
    onSuccess: (_user, nextRole) => {
      navigate(getHomePathForRole(nextRole))
      onNavigate?.()
    },
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login/seller')
    onNavigate?.()
  }

  return (
    <>
      <div className="mb-8 px-6">
        <h1 className="text-headline-lg font-bold text-primary">{APP_NAME}</h1>
        <p className="text-label-md tracking-wider text-on-surface-variant uppercase">Premium Marketplace</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 stitch-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 rounded-lg px-4 py-3 text-body-md transition-colors',
                isActive
                  ? 'border-r-4 border-primary bg-primary-container/10 font-bold text-primary'
                  : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary',
              )
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-outline-variant/30 px-3 pt-6">
        {showRoleSwitch ? (
          <div className="mb-3 rounded-lg bg-surface-container-highest p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-label-md text-on-surface">Seller Mode</p>
                <p className={cn('text-[10px] font-bold uppercase', sellerMode ? 'text-secondary' : 'text-outline')}>
                  {switchRoleMutation.isPending ? 'Switching…' : sellerMode ? 'Active' : 'Inactive'}
                </p>
              </div>
              <button
                type="button"
                disabled={switchRoleMutation.isPending || !sellerMode}
                onClick={() => switchRoleMutation.mutate('buyer')}
                aria-pressed={sellerMode}
                className={cn(
                  'relative h-6 w-12 shrink-0 rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
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
            {switchRoleMutation.isError ? (
              <p className="mt-2 text-xs text-error">
                {getApiErrorMessage(switchRoleMutation.error, 'Could not switch to buyer mode')}
              </p>
            ) : null}
          </div>
        ) : null}
        <Link
          to="/seller/profile"
          onClick={onNavigate}
          className="flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-surface-variant/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary-container bg-primary-container/20">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              person
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-label-md truncate font-bold text-on-surface">{displayName}</p>
            <p className="text-[10px] text-on-surface-variant">View profile</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-body-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 hover:text-error"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </>
  )
}

export function SellerSidebar({ mobileOpen, onClose }: SellerSidebarProps) {
  return (
    <>
      <aside className="app-header-safe fixed top-0 left-0 z-40 hidden h-dvh w-64 flex-col bg-surface-container-low py-6 md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
          <aside className="app-header-safe absolute top-0 left-0 flex h-dvh w-72 flex-col bg-surface-container-low py-6 shadow-lg">
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  )
}
