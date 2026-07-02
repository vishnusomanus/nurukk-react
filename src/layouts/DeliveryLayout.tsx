import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
import { NotificationsMenu } from '@/components/common/NotificationsMenu'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/delivery', label: 'Deliveries', icon: 'local_shipping', end: true },
  { to: '/delivery/history', label: 'History', icon: 'history', end: false },
  { to: '/delivery/earnings', label: 'Earnings', icon: 'payments', end: false },
]

export function DeliveryLayout() {
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)
  const userRole = useAuthStore((s) => s.user?.role)

  const { isLoading, isError } = useQuery({
    queryKey: ['delivery', 'profile'],
    queryFn: () => deliveryService.getProfile(),
    retry: false,
  })

  useEffect(() => {
    if (isLoading) return
    if (isError && userRole === 'delivery_agent') {
      navigate('/delivery/onboarding', { replace: true })
    }
  }, [isError, isLoading, navigate, userRole])

  return (
    <div className="min-h-dvh bg-surface-container-low pb-24 lg:pb-0">
      <header className="border-b border-outline-variant bg-surface">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <h1 className="text-headline-lg font-bold text-primary">Delivery Console</h1>
          <div className="flex items-center gap-2">
            <NotificationsMenu />
            <button
              type="button"
              onClick={async () => {
                await logout()
                navigate('/')
              }}
              className="text-label-md font-semibold text-error"
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="hidden border-t border-outline-variant/40 md:block">
          <div className="mx-auto flex max-w-3xl gap-1 px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-label-md font-bold transition-all',
                    isActive
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high',
                  )
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <Outlet />

      <nav className="fixed right-0 bottom-0 left-0 z-20 border-t border-outline-variant bg-surface px-2 py-2 md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-label-md font-bold transition-all',
                  isActive ? 'bg-primary-container/20 text-primary' : 'text-on-surface-variant',
                )
              }
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
