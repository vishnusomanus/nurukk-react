import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SellerFooter, SellerTopHeader } from '@/components/seller/SellerTopHeader'
import { SellerSidebar } from '@/components/seller/SellerSidebar'
import { resolveBreadcrumbBack } from '@/utils/breadcrumbBack'

export type SellerOutletContext = {
  search: string
  setSearch: (value: string) => void
}

function resolveSellerChrome(pathname: string) {
  if (pathname.match(/^\/seller\/orders\/[^/]+$/)) {
    return { title: 'Order Detail', showSearch: false }
  }
  if (pathname === '/seller/products/new') {
    return { title: 'New Product', showSearch: false }
  }
  if (pathname.match(/^\/seller\/products\/[^/]+\/edit$/)) {
    return { title: 'Edit Product', showSearch: false }
  }
  if (pathname === '/seller/profile/edit') {
    return { title: 'Edit Profile', showSearch: false }
  }
  if (pathname === '/seller/notifications') {
    return { title: 'Notifications', showSearch: false }
  }
  if (pathname === '/seller/products') {
    return { title: 'Products', showSearch: true, searchPlaceholder: 'Search inventory...' }
  }
  if (pathname === '/seller/orders') {
    return { title: 'Orders', showSearch: true, searchPlaceholder: 'Search orders...' }
  }
  if (pathname === '/seller/inventory') return { title: 'Inventory', showSearch: false }
  if (pathname === '/seller/coupons') return { title: 'Coupons', showSearch: false }
  if (pathname === '/seller/payouts') return { title: 'Payouts', showSearch: false }
  if (pathname === '/seller/delivery') return { title: 'Delivery', showSearch: false }
  if (pathname === '/seller/profile') return { title: 'Profile', showSearch: false }
  if (pathname === '/seller') return { title: 'Dashboard', showSearch: false }
  return { title: 'Seller', showSearch: false }
}

export function SellerMarketplaceLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation()

  const chrome = useMemo(() => resolveSellerChrome(location.pathname), [location.pathname])
  const backTo = useMemo(() => resolveBreadcrumbBack(location.pathname), [location.pathname])
  const showAddProduct = location.pathname === '/seller/products'

  return (
    <div className="stitch-marketplace min-h-dvh overflow-x-clip bg-background text-on-surface">
      <SellerSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-dvh flex-col md:ml-64">
        <SellerTopHeader
          title={chrome.title}
          backTo={backTo}
          onMenuClick={() => setMobileOpen(true)}
          searchValue={search}
          onSearchChange={chrome.showSearch ? setSearch : undefined}
          searchPlaceholder={chrome.searchPlaceholder}
          showAddProduct={showAddProduct}
        />
        <main className="scroll-touch flex-1 overflow-x-clip">
          <Outlet context={{ search, setSearch } satisfies SellerOutletContext} />
        </main>
        <SellerFooter />
      </div>
    </div>
  )
}
