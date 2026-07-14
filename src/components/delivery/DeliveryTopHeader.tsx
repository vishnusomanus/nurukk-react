import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { NotificationsMenu } from '@/components/common/NotificationsMenu'
import { APP_NAME, appCopyright } from '@/constants/app'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getLogoutRedirectPath } from '@/utils/authPaths'
import { resolveBreadcrumbBack } from '@/utils/breadcrumbBack'

type DeliveryTopHeaderProps = {
  title?: string
  backTo?: string | null
  showBrand?: boolean
}

type LocationFromState = {
  from?: string
}

export function DeliveryTopHeader({
  title,
  backTo,
  showBrand = false,
}: DeliveryTopHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)
  const userRole = useAuthStore((s) => s.user?.role)
  const from = (location.state as LocationFromState | null)?.from
  const target = backTo === null ? null : (backTo ?? resolveBreadcrumbBack(location.pathname, from))

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
          ) : showBrand ? (
            <Link to="/delivery" className="flex shrink-0 items-center lg:hidden" aria-label="Home">
              <BrandLogo size="sm" className="h-8" />
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
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:gap-3">
          {location.pathname.includes('/notifications') ? null : <NotificationsMenu />}
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate(getLogoutRedirectPath('/delivery', userRole), { replace: true })
            }}
            className="hidden size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low lg:flex"
            aria-label="Log out"
            title="Log out"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export function DeliveryFooter() {
  return (
    <footer className="mt-auto hidden w-full flex-col items-center justify-between gap-4 bg-surface-container-highest px-6 py-8 lg:flex lg:flex-row">
      <div>
        <p className="text-headline-lg font-bold text-primary">{APP_NAME}</p>
        <p className="mt-1 text-body-md text-on-surface-variant">{appCopyright()}. Freshness Guaranteed.</p>
      </div>
    </footer>
  )
}
