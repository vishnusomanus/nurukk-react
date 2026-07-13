import { NavLink, useNavigate } from 'react-router-dom'
import { APP_NAME } from '@/constants/app'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getLogoutRedirectPath } from '@/utils/authPaths'
import { cn } from '@/utils/cn'

type NavItem = {
  to: string
  label: string
  icon: string
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/admin/sellers', label: 'Verifications', icon: 'verified_user' },
  { to: '/admin/catalog', label: 'Catalog', icon: 'inventory_2' },
  { to: '/admin/categories', label: 'Categories', icon: 'category' },
  { to: '/admin/tags', label: 'Product Tags', icon: 'sell' },
  { to: '/admin/merchandising', label: 'Merchandising', icon: 'campaign' },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
  { to: '/admin/users', label: 'Users', icon: 'group' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'local_offer' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: 'history' },
  { to: '/admin/refunds', label: 'Refunds', icon: 'payments' },
  { to: '/admin/support', label: 'Support', icon: 'support_agent' },
  { to: '/admin/payouts', label: 'Payouts', icon: 'account_balance' },
  { to: '/admin/settings', label: 'Admin Settings', icon: 'settings' },
]

type AdminSidebarProps = {
  mobileOpen?: boolean
  onClose?: () => void
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const handleLogout = async () => {
    const role = user?.role
    await logout()
    navigate(getLogoutRedirectPath('/admin', role), { replace: true })
    onNavigate?.()
  }

  return (
    <>
      <div className="mb-8 px-4">
        <h1 className="text-headline-lg font-bold text-primary">{APP_NAME} Admin</h1>
        <p className="text-body-md text-on-surface-variant opacity-70">System Administrator</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 stitch-scrollbar">
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
                  : 'font-medium text-on-surface-variant hover:bg-surface-variant/50',
              )
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-outline-variant/30 px-2 pt-6">
        <div className="mb-4 px-4">
          <span className="rounded-full bg-primary-fixed/30 px-3 py-1 text-label-md text-primary">
            System Status: Active
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-body-md font-medium text-error transition-colors hover:bg-error-container/20"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
        {user?.email || user?.phone ? (
          <p className="px-4 pt-2 text-[10px] text-on-surface-variant">{user.email ?? user.phone}</p>
        ) : null}
      </div>
    </>
  )
}

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  return (
    <>
      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-64 flex-col bg-surface-container-low px-4 py-6 shadow-sm md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
          <aside className="absolute top-0 left-0 flex h-full w-72 flex-col bg-surface-container-low px-4 py-6 shadow-lg">
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  )
}
