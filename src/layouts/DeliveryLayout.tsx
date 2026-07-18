import { useEffect, useMemo } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
import { DeliveryBottomNav } from '@/components/delivery/DeliveryBottomNav'
import { DeliveryFooter, DeliveryTopHeader } from '@/components/delivery/DeliveryTopHeader'
import { useAuthStore } from '@/store/authStore'
import { isProfileNotFoundError } from '@/utils/apiErrorMessage'
import { resolveBreadcrumbBack } from '@/utils/breadcrumbBack'
import { cn } from '@/utils/cn'
import { useDeliveryLiveLocationSharing } from '@/hooks/useDeliveryLiveLocationSharing'

const DESKTOP_NAV = [
  { to: '/delivery', label: 'Deliveries', icon: 'local_shipping', end: true },
  { to: '/delivery/history', label: 'History', icon: 'history', end: false },
  { to: '/delivery/earnings', label: 'Earnings', icon: 'payments', end: false },
  { to: '/delivery/support', label: 'Support', icon: 'help', end: false },
  { to: '/delivery/account', label: 'Account', icon: 'person', end: false },
] as const

function resolveDeliveryChrome(pathname: string): {
  title: string
  showBack: boolean
  showBrand: boolean
  backTo?: string
} {
  if (pathname.startsWith('/delivery/history')) {
    return { title: 'History', showBack: false, showBrand: false }
  }
  if (pathname.startsWith('/delivery/earnings')) {
    return { title: 'Earnings', showBack: false, showBrand: false }
  }
  if (pathname.startsWith('/delivery/support')) {
    return { title: 'Help & Support', showBack: false, showBrand: false }
  }
  if (pathname.startsWith('/delivery/account')) {
    return { title: 'Account', showBack: false, showBrand: false }
  }
  if (pathname.startsWith('/delivery/notifications')) {
    return { title: 'Notifications', showBack: true, backTo: '/delivery', showBrand: false }
  }
  return { title: 'Deliveries', showBack: false, showBrand: true }
}

export function DeliveryLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = useAuthStore((s) => s.user?.role)
  const token = useAuthStore((s) => s.token)

  useDeliveryLiveLocationSharing(Boolean(token))

  const { isLoading, isError, error } = useQuery({
    queryKey: ['delivery', 'profile'],
    queryFn: () => deliveryService.getProfile(),
    retry: false,
  })

  useEffect(() => {
    if (isLoading) return
    if (isError && userRole === 'delivery_agent' && isProfileNotFoundError(error)) {
      navigate('/delivery/onboarding', { replace: true })
    }
  }, [error, isError, isLoading, navigate, userRole])

  const chrome = useMemo(() => resolveDeliveryChrome(location.pathname), [location.pathname])
  const resolvedBack = useMemo(
    () => chrome.backTo ?? resolveBreadcrumbBack(location.pathname),
    [chrome.backTo, location.pathname],
  )
  const backTo = chrome.showBack ? resolvedBack : null

  return (
    <div className="stitch-marketplace flex min-h-dvh w-full flex-col overflow-x-clip bg-background text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-outline-variant/40 bg-surface lg:flex">
        <div className="border-b border-outline-variant/30 px-5 py-5">
          <p className="text-headline-lg font-bold text-primary">nurukk Delivery</p>
          <p className="text-body-md mt-1 text-on-surface-variant">Courier console</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {DESKTOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
                  isActive
                    ? 'bg-primary text-on-primary shadow-[0_8px_20px_-8px_rgba(13,99,27,0.45)]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                )
              }
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-dvh flex-col lg:ml-64">
        <DeliveryTopHeader title={chrome.title} backTo={backTo} showBrand={chrome.showBrand} />
        <main className="scroll-touch flex-1 overflow-x-clip">
          <div className="mx-auto w-full max-w-lg lg:max-w-none">
            <Outlet />
          </div>
        </main>
        <DeliveryFooter />
      </div>

      <DeliveryBottomNav />
    </div>
  )
}
