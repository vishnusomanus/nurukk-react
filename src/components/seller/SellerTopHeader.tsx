import { Link, useLocation } from 'react-router-dom'
import { NotificationsMenu } from '@/components/common/NotificationsMenu'
import { APP_NAME, appCopyright } from '@/constants/app'
import { resolveBreadcrumbBack } from '@/utils/breadcrumbBack'
import { cn } from '@/utils/cn'

type SellerTopHeaderProps = {
  title?: string
  backTo?: string | null
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  showAddProduct?: boolean
  onMenuClick?: () => void
}

type LocationFromState = {
  from?: string
}

export function SellerTopHeader({
  title,
  backTo,
  searchPlaceholder = 'Search orders, products...',
  searchValue = '',
  onSearchChange,
  showAddProduct = false,
  onMenuClick,
}: SellerTopHeaderProps) {
  const location = useLocation()
  const from = (location.state as LocationFromState | null)?.from
  const target = backTo ?? resolveBreadcrumbBack(location.pathname, from)
  const showSearch = typeof onSearchChange === 'function'

  return (
    <header className="app-header-safe sticky top-0 z-30 w-full bg-surface shadow-sm">
      <div className="flex h-16 w-full items-center justify-between gap-3 px-4 md:h-20 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
          {target ? (
            <Link
              to={target}
              className="rounded-lg p-2 text-on-surface-variant hover:text-primary md:hidden"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          ) : (
            <button
              type="button"
              className="rounded-lg p-2 text-on-surface-variant hover:text-primary md:hidden"
              onClick={onMenuClick}
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          )}

          {title ? (
            <h1 className="truncate text-headline-lg font-bold text-on-surface md:hidden">{title}</h1>
          ) : null}

          {showSearch ? (
            <div className="relative hidden w-full max-w-md md:block">
              <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-full border-none bg-surface-container-low py-2 pr-4 pl-12 text-body-md focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3 md:gap-6">
          <NotificationsMenu />

          {showAddProduct ? (
            <Link
              to="/seller/products/new"
              className={cn(
                'flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-label-md text-on-primary',
                'transition-all hover:shadow-lg active:scale-95',
              )}
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden sm:inline">ADD PRODUCT</span>
            </Link>
          ) : (
            <Link to="/seller/profile" className="text-on-surface-variant transition-colors hover:text-primary">
              <span className="material-symbols-outlined">account_circle</span>
            </Link>
          )}
        </div>
      </div>

      {showSearch ? (
        <div className="border-t border-outline-variant/40 px-4 pb-3 md:hidden">
          <div className="relative">
            <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border-none bg-surface-container-low py-2.5 pr-4 pl-11 text-body-md focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function SellerFooter() {
  return (
    <footer className="mt-8 hidden w-full flex-col items-center justify-between gap-4 bg-surface-container-highest px-6 py-8 md:flex md:flex-row">
      <div>
        <p className="text-headline-lg font-bold text-primary">{APP_NAME}</p>
        <p className="mt-1 text-body-md text-on-surface-variant">{appCopyright()}. Freshness Guaranteed.</p>
      </div>
    </footer>
  )
}
