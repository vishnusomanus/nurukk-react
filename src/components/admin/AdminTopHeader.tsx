import { NotificationsMenu } from '@/components/common/NotificationsMenu'
import { useAuthStore } from '@/store/authStore'

type AdminTopHeaderProps = {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onMenuClick?: () => void
  title?: string
}

export function AdminTopHeader({
  searchPlaceholder = 'Search system logs, products, users...',
  searchValue = '',
  onSearchChange,
  onMenuClick,
  title = 'Admin Dashboard',
}: AdminTopHeaderProps) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-none bg-surface px-4 py-3 shadow-sm md:px-8">
      <div className="flex flex-1 items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-on-surface-variant hover:text-primary md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <h2 className="hidden text-headline-lg text-on-surface whitespace-nowrap md:block">{title}</h2>

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
        <button type="button" className="rounded-full p-2 transition-all hover:bg-surface-container-high">
          <span className="material-symbols-outlined text-on-surface-variant">dns</span>
        </button>
        <div className="hidden h-8 w-px bg-outline-variant sm:block" />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-label-md text-on-surface">{user?.name ?? 'Super Admin'}</p>
            <p className="text-[10px] text-on-surface-variant">Global Access</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-primary-container/20">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_circle
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
