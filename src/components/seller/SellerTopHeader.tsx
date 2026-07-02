import { Link } from 'react-router-dom'
import { NotificationsMenu } from '@/components/common/NotificationsMenu'
import { APP_NAME, appCopyright } from '@/constants/app'
import { cn } from '@/utils/cn'

type SellerTopHeaderProps = {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  showAddProduct?: boolean
  onMenuClick?: () => void
}

export function SellerTopHeader({
  searchPlaceholder = 'Search orders, products...',
  searchValue = '',
  onSearchChange,
  showAddProduct = false,
  onMenuClick,
}: SellerTopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-surface px-4 py-4 shadow-sm md:px-8">
      <div className="flex flex-1 items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-on-surface-variant hover:text-primary md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

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
      </div>

      <div className="flex items-center gap-4 md:gap-6">
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
    </header>
  )
}

export function SellerFooter() {
  return (
    <footer className="mt-8 flex w-full flex-col items-center justify-between gap-4 bg-surface-container-highest px-6 py-8 md:flex-row">
      <div>
        <p className="text-headline-lg font-bold text-primary">{APP_NAME}</p>
        <p className="mt-1 text-body-md text-on-surface-variant">{appCopyright()}. Freshness Guaranteed.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {['Sustainability', 'About Us', 'Farm Partners', 'Privacy Policy', 'Terms of Service'].map((label) => (
          <span key={label} className="text-body-md text-on-surface-variant">
            {label}
          </span>
        ))}
      </div>
    </footer>
  )
}
