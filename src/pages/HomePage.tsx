import { Link, Navigate } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { APP_NAME, appCopyright } from '@/constants/app'
import {
  APP_ROLE,
  getAppHomePath,
  getAppLoginPath,
  isMultiPortalApp,
} from '@/config/appRole'
import { useAuthStore } from '@/store/authStore'
import { getHomePathForRole } from '@/utils/authRole'
import { cn } from '@/utils/cn'

const ROLE_PORTALS = [
  {
    to: '/login/buyer',
    icon: 'shopping_basket',
    title: 'Shop Fresh Produce',
    description: 'Browse local farms, order vegetables, and track deliveries.',
    accent: 'bg-primary-container text-on-primary-container',
  },
  {
    to: '/login/seller',
    icon: 'storefront',
    title: 'Sell on nurukk',
    description: 'Manage your farm store, inventory, and customer orders.',
    accent: 'bg-secondary-container/20 text-secondary',
  },
  {
    to: '/login/delivery',
    icon: 'delivery_dining',
    title: 'Delivery Console',
    description: 'Pick up and deliver orders across the marketplace.',
    accent: 'bg-tertiary-container/15 text-tertiary-container',
  },
  {
    to: '/login/admin',
    icon: 'admin_panel_settings',
    title: 'Admin Access',
    description: 'Staff sign-in for catalog, users, and operations.',
    accent: 'bg-surface-container-highest text-on-surface',
  },
] as const

export function HomePage() {
  const user = useAuthStore((s) => s.user)

  if (!isMultiPortalApp) {
    if (user) {
      return <Navigate to={getAppHomePath(APP_ROLE)} replace />
    }
    return <Navigate to={getAppLoginPath(APP_ROLE)} replace />
  }

  if (user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  return (
    <div className="stitch-auth-page stitch-body stitch-login-bg relative flex min-h-dvh flex-col items-center">
      <div className="stitch-login-overlay pointer-events-none fixed inset-0" aria-hidden />

      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col px-margin-mobile pt-12 pb-16">
        <header className="mb-10 flex flex-col items-center text-center">
          <BrandLogo kind="buyer" className="mb-6" />
          <h1 className="text-headline-xl mb-2 tracking-tight text-primary">{APP_NAME}</h1>
          <p className="text-body-lg max-w-md font-medium leading-relaxed text-on-surface-variant">
            Premium organic produce from farm to your kitchen table.
          </p>
        </header>

        <div className="stitch-glass-card rounded-[2rem] p-6">
          <p className="text-label-md mb-4 tracking-widest text-on-surface-variant opacity-80">
            CHOOSE YOUR PORTAL
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLE_PORTALS.map((portal) => (
              <Link
                key={portal.to}
                to={portal.to}
                className={cn(
                  'group rounded-2xl border border-primary/10 bg-white/40 p-5 text-left transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]',
                )}
              >
                <div
                  className={cn(
                    'mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                    portal.accent,
                  )}
                >
                  <span className="material-symbols-outlined">{portal.icon}</span>
                </div>
                <h2 className="text-body-lg font-bold text-on-surface">{portal.title}</h2>
                <p className="text-body-md mt-1 text-on-surface-variant">{portal.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <p className="text-body-md mt-6 text-center text-on-surface-variant">
          New to the marketplace?{' '}
          <Link to="/register/buyer" className="font-bold text-primary hover:opacity-80">
            Create a buyer account
          </Link>
          <span className="mx-2 opacity-40">·</span>
          <Link to="/register/seller" className="font-bold text-primary hover:opacity-80">
            Register as seller
          </Link>
        </p>
      </main>

      <footer className="relative z-10 mt-auto flex w-full max-w-2xl flex-col gap-3 px-margin-mobile pb-8 text-center">
        <div className="flex items-center justify-center gap-4">
          <a className="text-label-md font-bold text-primary transition-opacity hover:opacity-70" href="#">
            Terms &amp; Conditions
          </a>
          <span className="h-1 w-1 rounded-full bg-primary/20" />
          <a className="text-label-md font-bold text-primary transition-opacity hover:opacity-70" href="#">
            Privacy Policy
          </a>
        </div>
        <p className="text-label-md mt-2 tracking-[0.2em] text-on-surface-variant/40 uppercase">
          {appCopyright()}
        </p>
      </footer>
    </div>
  )
}
