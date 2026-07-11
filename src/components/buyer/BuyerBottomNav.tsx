import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { getCartBadgeCount } from '@/utils/cartCount'
import { cn } from '@/utils/cn'

const items: {
  to: string
  label: string
  icon: string
  end: boolean
  badge?: boolean
}[] = [
  { to: '/buyer', label: 'Home', icon: 'home', end: true },
  { to: '/buyer/categories', label: 'Categories', icon: 'category', end: false },
  { to: '/buyer/checkout', label: 'Cart', icon: 'shopping_cart', end: false, badge: true },
  { to: '/buyer/orders', label: 'Orders', icon: 'receipt_long', end: false },
  { to: '/buyer/profile', label: 'Profile', icon: 'person', end: false },
]

/** Routes that hide the bottom tab bar (full-screen flows). */
export function isBuyerBottomNavHidden(pathname: string) {
  return (
    pathname.includes('/checkout/payment') ||
    pathname.includes('/success') ||
    pathname.includes('/invoice') ||
    pathname.includes('/products/')
  )
}

export function BuyerBottomNav() {
  const location = useLocation()
  const hide = isBuyerBottomNavHidden(location.pathname)

  const { data } = useQuery({
    queryKey: ['buyer', 'cart'],
    queryFn: () => buyerService.getCart(),
  })
  const cartCount = getCartBadgeCount(data)

  if (hide) return null

  return (
    <nav className="app-bottom-nav-safe fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl bg-surface px-1 pt-2 shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          data-cart-target={item.badge ? true : undefined}
          className={({ isActive }) =>
            cn(
              'relative flex flex-col items-center justify-center rounded-full px-4 py-1 transition-all duration-200 active:scale-95',
              isActive
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-variant',
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
              <span className="text-label-md mt-0.5">{item.label}</span>
              {item.badge && cartCount > 0 ? (
                <span className="absolute top-0 right-3 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-secondary-container text-[9px] text-white">
                  {cartCount}
                </span>
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
