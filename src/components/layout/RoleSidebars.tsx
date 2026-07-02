import { NavLink } from 'react-router-dom'
import { APP_NAME } from '@/constants/app'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { useSidebarStore } from '@/store/sidebarStore'
import {
  LayoutDashboard,
  Users,
  Store,
  FolderTree,
  TicketPercent,
  ShoppingBag,
  Settings,
  Package,
  Warehouse,
  MapPin,
  Heart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

function SidebarNav({ title, items }: { title: string; items: NavItem[] }) {
  const isOpen = useSidebarStore((s) => s.isOpen)
  const close = useSidebarStore((s) => s.close)
  const user = useAuthStore((s) => s.user)

  const nav = (
    <div className="flex h-full flex-col">
      <div className="px-3 py-3">
        <div className="rounded-xl border border-black/10 bg-white px-3 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-white/60">
            {user ? user.email ?? user.phone ?? user.name : '—'}
          </div>
        </div>
      </div>
      <div className="flex-1 px-3 pb-3">
        <div className="space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              onClick={() => close()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white',
                  isActive && 'bg-zinc-900/5 text-zinc-900 dark:bg-white/10 dark:text-white',
                )
              }
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none md:block">
        {nav}
      </aside>
      {isOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-hidden border-r border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
            {nav}
          </aside>
        </div>
      ) : null}
    </>
  )
}

const adminItems: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/sellers', label: 'Sellers', icon: Store },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

const buyerItems: NavItem[] = [
  { to: '/buyer', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/buyer/orders', label: 'My Orders', icon: ShoppingBag },
  { to: '/buyer/addresses', label: 'Addresses', icon: MapPin },
  { to: '/buyer/wishlist', label: 'Wishlist', icon: Heart },
]

const sellerItems: NavItem[] = [
  { to: '/seller', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/seller/products', label: 'Products', icon: Package },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/seller/inventory', label: 'Inventory', icon: Warehouse },
]

export function AdminSidebar() {
  return <SidebarNav title={`${APP_NAME} Admin`} items={adminItems} />
}

export function BuyerSidebar() {
  return <SidebarNav title="VEG Buyer" items={buyerItems} />
}

export function SellerSidebar() {
  return <SidebarNav title="VEG Seller" items={sellerItems} />
}
