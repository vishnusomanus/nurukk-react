import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SellerFooter, SellerTopHeader } from '@/components/seller/SellerTopHeader'
import { SellerSidebar } from '@/components/seller/SellerSidebar'

export type SellerOutletContext = {
  search: string
  setSearch: (value: string) => void
}

export function SellerMarketplaceLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation()

  const searchPlaceholder = useMemo(() => {
    if (location.pathname.startsWith('/seller/products')) return 'Search inventory...'
    if (location.pathname.startsWith('/seller/orders')) return 'Search orders...'
    return 'Search orders, products...'
  }, [location.pathname])

  const showAddProduct = location.pathname === '/seller/products'

  return (
    <div className="stitch-marketplace min-h-dvh bg-background text-on-surface">
      <SellerSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-dvh flex-col md:ml-64">
        <SellerTopHeader
          onMenuClick={() => setMobileOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          showAddProduct={showAddProduct}
        />
        <main className="flex-1">
          <Outlet context={{ search, setSearch } satisfies SellerOutletContext} />
        </main>
        <SellerFooter />
      </div>
    </div>
  )
}
