import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/buyer/profile', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/buyer/orders', label: 'Order History', icon: 'receipt_long', end: false },
  { to: '/buyer/addresses', label: 'Saved Addresses', icon: 'location_on', end: false },
  { to: '/buyer/wishlist', label: 'Favorites', icon: 'favorite', end: false },
  { to: '/buyer/profile/personal', label: 'Settings', icon: 'settings', end: false },
] as const

export function BuyerAccountSidebar({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user)
  const displayName = user?.name?.trim() || 'Member'

  return (
    <aside
      className={cn(
        'hidden w-64 shrink-0 flex-col gap-2 bg-surface-container-low py-8 px-4 lg:flex lg:sticky lg:top-20 lg:self-start lg:h-[calc(100vh-5rem)]',
        className,
      )}
    >
      <div className="mb-6 px-2">
        <h2 className="text-headline-lg text-primary">My Account</h2>
        <p className="text-body-md text-on-surface-variant">Manage your harvest</p>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface-container-highest p-3">
        <div className="rounded-lg bg-secondary-container p-1.5">
          <span
            className="material-symbols-outlined text-on-secondary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-label-md font-bold text-on-background">{displayName}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 rounded-xl px-4 py-2.5 text-body-lg transition-all duration-200',
                isActive
                  ? 'bg-primary-container font-semibold text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-highest',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
