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
}

type LocationFromState = {
  from?: string
}

export function SellerTopHeader({
  title,
  backTo,
  searchPlaceholder = 'Search…',
  searchValue = '',
  onSearchChange,
  showAddProduct = false,
}: SellerTopHeaderProps) {
  const location = useLocation()
  const from = (location.state as LocationFromState | null)?.from
  const target = backTo === null ? null : (backTo ?? resolveBreadcrumbBack(location.pathname, from))
  const showSearch = typeof onSearchChange === 'function'

  return (
    <header className="app-header-safe sticky top-0 z-40 w-full border-b border-outline-variant/30 bg-surface/95 shadow-[0_2px_12px_rgba(15,40,20,0.06)] backdrop-blur-md lg:border-b-0 lg:bg-surface lg:shadow-sm lg:backdrop-blur-none">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between gap-2 px-3 sm:px-margin-mobile lg:h-16 lg:max-w-none lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          {target ? (
            <Link
              to={target}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container-low lg:hidden"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </Link>
          ) : (
            <span className="hidden size-2 shrink-0 lg:block" aria-hidden />
          )}

          {title ? (
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-primary sm:text-lg lg:hidden">{title}</h1>
              <p className="hidden text-sm font-bold text-on-surface lg:block">{title}</p>
            </div>
          ) : null}

          {showSearch ? (
            <div className="relative ml-2 hidden w-full max-w-md lg:block">
              <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-full border-none bg-surface-container-low py-2.5 pr-4 pl-12 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:gap-3">
          {location.pathname.includes('/notifications') ? null : <NotificationsMenu />}

          {showAddProduct ? (
            <Link
              to="/seller/products/new"
              className={cn(
                'hidden items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-all hover:shadow-lg active:scale-95 lg:flex',
              )}
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add product
            </Link>
          ) : null}
        </div>
      </div>

      {showSearch ? (
        <div className="border-t border-outline-variant/30 px-3 pb-3 sm:px-margin-mobile lg:hidden">
          <div className="relative">
            <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-full border-none bg-surface-container-lowest py-2.5 pr-4 pl-11 text-[16px] text-on-surface shadow-[0_2px_12px_rgba(15,40,20,0.06)] outline-none placeholder:text-outline focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function SellerFooter() {
  return (
    <footer className="mt-auto hidden w-full flex-col items-center justify-between gap-4 bg-surface-container-highest px-6 py-8 lg:flex lg:flex-row">
      <div>
        <p className="text-headline-lg font-bold text-primary">{APP_NAME}</p>
        <p className="mt-1 text-body-md text-on-surface-variant">{appCopyright()}. Freshness Guaranteed.</p>
      </div>
    </footer>
  )
}
