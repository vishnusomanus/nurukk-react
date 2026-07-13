import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { NotificationsMenu } from '@/components/common/NotificationsMenu'
import { DeliveryLocationControl } from '@/components/buyer/DeliveryLocationControl'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useAuthStore } from '@/store/authStore'
import { APP_NAME } from '@/constants/app'
import { getCartBadgeCount } from '@/utils/cartCount'
import { cn } from '@/utils/cn'

export function BuyerDesktopHeader() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')

  const { data: cartData } = useQuery({
    queryKey: ['buyer', 'cart'],
    queryFn: () => buyerService.getCart(),
  })

  const { data: menuCategoriesData } = useQuery({
    queryKey: ['buyer', 'categories', 'menu'],
    queryFn: () => buyerService.listMenuCategories(),
  })

  const cartCount = getCartBadgeCount(cartData)
  const menuCategories = menuCategoriesData?.data ?? []

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (q) navigate(`/buyer/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-50 hidden w-full bg-surface shadow-[0px_4px_20px_rgba(0,0,0,0.05)] lg:block">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 xl:px-8">
        <div className="flex min-w-0 items-center gap-8 xl:gap-10">
          <Link to="/buyer" className="flex shrink-0 items-center gap-2.5" aria-label={APP_NAME}>
            <BrandLogo size="sm" className="h-10 w-auto max-w-[88px]" alt="" />
            <span className="text-headline-lg font-bold text-primary">{APP_NAME}</span>
          </Link>
          <nav className="stitch-hide-scrollbar flex min-w-0 items-center gap-6 overflow-x-auto overflow-y-hidden pb-0.5">
            <NavLink
              to="/buyer/categories"
              end
              className={({ isActive }) =>
                cn(
                  'shrink-0 text-body-lg transition-colors duration-200',
                  isActive
                    ? 'border-b-2 border-primary pb-1 font-bold text-primary'
                    : 'text-on-surface-variant hover:text-primary',
                )
              }
            >
              Shop All
            </NavLink>
            <NavLink
              to="/buyer/recipes"
              className={({ isActive }) =>
                cn(
                  'shrink-0 text-body-lg transition-colors duration-200',
                  isActive
                    ? 'border-b-2 border-primary pb-1 font-bold text-primary'
                    : 'text-on-surface-variant hover:text-primary',
                )
              }
            >
              Recipes
            </NavLink>

            {menuCategories.map((category) => (
              <NavLink
                key={category.uuid}
                to={`/buyer/categories/${category.uuid}`}
                end
                className={({ isActive }) =>
                  cn(
                    'shrink-0 text-body-lg transition-colors duration-200',
                    isActive
                      ? 'border-b-2 border-primary pb-1 font-bold text-primary'
                      : 'text-on-surface-variant hover:text-primary',
                  )
                }
              >
                {category.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <form onSubmit={onSearch} className="relative hidden xl:block">
            <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-body-md w-64 rounded-full border-none bg-surface-container-low py-2 pr-4 pl-10 focus:ring-2 focus:ring-primary"
              placeholder="Search vegetables..."
            />
          </form>

          <DeliveryLocationControl variant="desktop" />

          <NotificationsMenu />

          <Link
            to="/buyer/checkout"
            data-cart-target
            className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined">shopping_basket</span>
            {cartCount > 0 ? (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>

          <Link
            to="/buyer/profile"
            className="flex items-center gap-2 rounded-full p-1 text-on-surface-variant transition-colors hover:text-primary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-primary-container/20 text-sm font-bold text-primary">
              {(user?.name?.[0] ?? user?.phone?.[0] ?? 'A').toUpperCase()}
            </div>
            <span className="text-label-md hidden 2xl:block">Account</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
