import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import type { SellerOrder } from '@/api/services/sellerService'
import { extractRows } from '@/utils/extractRows'
import { filterSellerOrdersByTab } from '@/utils/sellerOrderStatus'
import { cn } from '@/utils/cn'

const leftItems = [
  { to: '/seller', label: 'Home', icon: 'home', end: true },
  { to: '/seller/products', label: 'Products', icon: 'inventory_2', end: false },
] as const

const rightItems = [
  { to: '/seller/inventory', label: 'Inventory', icon: 'warehouse', end: false },
  { to: '/seller/profile', label: 'Profile', icon: 'person', end: false },
] as const

/** Full-screen flows where the seller tab bar should hide. */
export function isSellerBottomNavHidden(pathname: string) {
  return (
    pathname.includes('/products/new') ||
    (pathname.includes('/products/') && pathname.includes('/edit')) ||
    pathname.includes('/recipes/new') ||
    (pathname.includes('/recipes/') && pathname.includes('/edit')) ||
    pathname.match(/\/seller\/orders\/[^/]+$/) != null ||
    pathname.includes('/profile/edit') ||
    pathname.includes('/onboarding')
  )
}

function SideTab({
  to,
  label,
  icon,
  end,
}: {
  to: string
  label: string
  icon: string
  end: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className="relative flex size-11 flex-col items-center justify-center transition-transform active:scale-95"
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'material-symbols-outlined text-[24px] leading-none transition-colors',
              isActive ? 'text-primary' : 'text-[#9aa39a]',
            )}
            style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {icon}
          </span>
          <span
            className={cn(
              'absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-primary transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden
          />
          <span className="sr-only">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function SellerBottomNav() {
  const location = useLocation()
  const hide = isSellerBottomNavHidden(location.pathname)

  const { data } = useQuery({
    queryKey: ['seller', 'orders', 'nav-active-count'],
    queryFn: () => sellerService.listOrders({ page: 1, per_page: 50 }),
    enabled: !hide,
    staleTime: 30_000,
    refetchInterval: hide ? false : 60_000,
  })

  const activeCount = filterSellerOrdersByTab(
    extractRows(data?.data) as SellerOrder[],
    'active',
  ).length

  if (hide) return null

  const ordersActive =
    location.pathname === '/seller/orders' || location.pathname.startsWith('/seller/orders/')

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-5 pb-[max(0.65rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Seller navigation"
    >
      <div className="pointer-events-auto relative mx-auto h-[5.25rem] w-full max-w-[22.5rem]">
        <div aria-hidden className="absolute inset-x-1 bottom-0 h-[3.75rem] rounded-full bg-black/20 blur-xl" />
        <div aria-hidden className="absolute inset-x-3 bottom-1 h-11 rounded-full bg-black/10 blur-md" />

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-14 border border-black/[0.06] bg-white/80 shadow-[0_8px_28px_-6px_rgba(15,23,42,0.28),0_2px_8px_-2px_rgba(15,23,42,0.12)] backdrop-blur-xl backdrop-saturate-150"
          style={{
            borderRadius: 9999,
            WebkitMaskImage:
              'radial-gradient(circle 34px at 50% 0px, transparent 33.5px, #000 34px)',
            maskImage:
              'radial-gradient(circle 34px at 50% 0px, transparent 33.5px, #000 34px)',
          }}
        />

        <div className="absolute inset-x-0 bottom-0 flex h-14 items-center px-2">
          <div className="flex flex-1 items-center justify-evenly pr-7">
            {leftItems.map((item) => (
              <SideTab key={item.to} {...item} />
            ))}
          </div>
          <div className="w-14 shrink-0" aria-hidden />
          <div className="flex flex-1 items-center justify-evenly pl-7">
            {rightItems.map((item) => (
              <SideTab key={item.to} {...item} />
            ))}
          </div>
        </div>

        <NavLink
          to="/seller/orders"
          aria-label={activeCount > 0 ? `Orders, ${activeCount} active` : 'Orders'}
          className={cn(
            'absolute top-0 left-1/2 z-10 flex size-14 -translate-x-1/2 flex-col items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_10px_22px_-4px_rgba(13,99,27,0.45)] transition-transform active:scale-95',
            ordersActive && 'ring-[3px] ring-primary/25',
          )}
        >
          <span
            className="material-symbols-outlined text-[26px] leading-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            receipt_long
          </span>
          {activeCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-secondary-container px-1 text-[10px] font-bold text-white">
              {activeCount > 99 ? '99+' : activeCount}
            </span>
          ) : null}
        </NavLink>
      </div>
    </nav>
  )
}
