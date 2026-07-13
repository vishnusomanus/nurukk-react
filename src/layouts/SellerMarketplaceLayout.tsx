import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import { SellerBottomNav } from '@/components/seller/SellerBottomNav'
import { SellerFooter, SellerTopHeader } from '@/components/seller/SellerTopHeader'
import { SellerSidebar } from '@/components/seller/SellerSidebar'
import { useAuthStore } from '@/store/authStore'
import { isProfileNotFoundError } from '@/utils/apiErrorMessage'
import { resolveBreadcrumbBack } from '@/utils/breadcrumbBack'

export type SellerOutletContext = {
  search: string
  setSearch: (value: string) => void
}

function resolveSellerChrome(pathname: string) {
  if (pathname.match(/^\/seller\/orders\/[^/]+$/)) {
    return { title: 'Order Detail', showSearch: false, showBack: true, backTo: '/seller/orders' }
  }
  if (pathname === '/seller/products/new') {
    return { title: 'New Product', showSearch: false, showBack: true, backTo: '/seller/products' }
  }
  if (pathname.match(/^\/seller\/products\/[^/]+\/edit$/)) {
    return { title: 'Edit Product', showSearch: false, showBack: true, backTo: '/seller/products' }
  }
  if (pathname === '/seller/recipes/new') {
    return { title: 'New Recipe', showSearch: false, showBack: true, backTo: '/seller/recipes' }
  }
  if (pathname.match(/^\/seller\/recipes\/[^/]+\/edit$/)) {
    return { title: 'Edit Recipe', showSearch: false, showBack: true, backTo: '/seller/recipes' }
  }
  if (pathname === '/seller/profile/edit') {
    return { title: 'Edit Profile', showSearch: false, showBack: true, backTo: '/seller/profile' }
  }
  if (pathname === '/seller/notifications') {
    return { title: 'Notifications', showSearch: false, showBack: true, backTo: '/seller/profile' }
  }
  if (pathname === '/seller/products') {
    return { title: 'Products', showSearch: true, searchPlaceholder: 'Search products…', showBack: false }
  }
  if (pathname === '/seller/recipes') {
    return {
      title: 'Recipes',
      showSearch: true,
      searchPlaceholder: 'Search recipes, bundles…',
      showBack: false,
    }
  }
  if (pathname === '/seller/orders') {
    return { title: 'Orders', showSearch: true, searchPlaceholder: 'Search orders…', showBack: false }
  }
  if (pathname === '/seller/inventory') {
    return { title: 'Inventory', showSearch: false, showBack: false }
  }
  if (pathname === '/seller/coupons') {
    return { title: 'Coupons', showSearch: false, showBack: true, backTo: '/seller/profile' }
  }
  if (pathname === '/seller/payouts') {
    return { title: 'Payouts', showSearch: false, showBack: true, backTo: '/seller/profile' }
  }
  if (pathname === '/seller/delivery') {
    return { title: 'Delivery', showSearch: false, showBack: true, backTo: '/seller/profile' }
  }
  if (pathname === '/seller/profile') return { title: 'Profile', showSearch: false, showBack: false }
  if (pathname === '/seller') return { title: 'Home', showSearch: false, showBack: false }
  return { title: 'Seller', showSearch: false, showBack: false }
}

export function SellerMarketplaceLayout() {
  const [search, setSearch] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const userRole = useAuthStore((s) => s.user?.role)

  const profileQuery = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => sellerService.getProfile(),
    retry: false,
  })

  useEffect(() => {
    if (profileQuery.isLoading || profileQuery.isFetching) return
    if (
      profileQuery.isError &&
      userRole === 'seller' &&
      isProfileNotFoundError(profileQuery.error)
    ) {
      navigate('/seller/onboarding', { replace: true })
    }
  }, [
    navigate,
    profileQuery.error,
    profileQuery.isError,
    profileQuery.isFetching,
    profileQuery.isLoading,
    userRole,
  ])

  const chrome = useMemo(() => resolveSellerChrome(location.pathname), [location.pathname])
  const resolvedBack = useMemo(
    () => chrome.backTo ?? resolveBreadcrumbBack(location.pathname),
    [chrome.backTo, location.pathname],
  )
  const showAddProduct = location.pathname === '/seller/products'
  const showAddRecipe = location.pathname === '/seller/recipes'
  const backTo = chrome.showBack ? resolvedBack : null

  return (
    <div className="stitch-marketplace flex min-h-dvh w-full flex-col overflow-x-clip bg-background text-on-surface">
      <SellerSidebar />

      <div className="flex min-h-dvh flex-col lg:ml-64">
        <SellerTopHeader
          title={chrome.title}
          backTo={backTo}
          searchValue={search}
          onSearchChange={chrome.showSearch ? setSearch : undefined}
          searchPlaceholder={chrome.searchPlaceholder}
          showAddProduct={showAddProduct}
          showAddRecipe={showAddRecipe}
        />
        <main className="scroll-touch flex-1 overflow-x-clip">
          <div className="mx-auto w-full max-w-lg lg:max-w-none">
            <Outlet context={{ search, setSearch } satisfies SellerOutletContext} />
          </div>
        </main>
        <SellerFooter />
      </div>

      <SellerBottomNav />
    </div>
  )
}
