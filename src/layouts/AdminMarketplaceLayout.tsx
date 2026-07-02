import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopHeader } from '@/components/admin/AdminTopHeader'

export type AdminOutletContext = {
  search: string
  setSearch: (value: string) => void
}

export function AdminMarketplaceLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation()

  const searchPlaceholder = useMemo(() => {
    if (location.pathname.startsWith('/admin/sellers')) return 'Search applications, farms, or locations...'
    if (location.pathname.startsWith('/admin/catalog')) return 'Search catalog items...'
    if (location.pathname.startsWith('/admin/categories')) return 'Search categories...'
    if (location.pathname.startsWith('/admin/tags')) return 'Search product tags...'
    if (location.pathname.startsWith('/admin/settings')) return 'Global system search...'
    return 'Search system logs, products, users...'
  }, [location.pathname])

  return (
    <div className="stitch-marketplace min-h-dvh bg-background text-on-surface">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-dvh flex-col md:ml-64">
        <AdminTopHeader
          onMenuClick={() => setMobileOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
        />
        <main className="flex-1">
          <Outlet context={{ search, setSearch } satisfies AdminOutletContext} />
        </main>
      </div>
    </div>
  )
}
