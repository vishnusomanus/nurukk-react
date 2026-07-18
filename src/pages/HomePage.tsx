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

const JOURNEY = [
  {
    icon: 'wb_twilight',
    title: 'Picked at first light',
    description: 'Growers list what left the soil that morning — not what sat in a warehouse.',
  },
  {
    icon: 'grocery',
    title: 'Chosen for your kitchen',
    description: 'Browse nearby farms, build a basket, and pick a delivery window that fits.',
  },
  {
    icon: 'two_wheeler',
    title: 'Rushed while it’s crisp',
    description: 'Riders move produce from farm gate to doorstep before the day cools.',
  },
] as const

const PATHS = [
  {
    to: '/login/buyer',
    icon: 'skillet',
    mark: '01',
    tone: 'stitch-landing-path--kitchen',
    title: 'For kitchens',
    description: 'Shop organic produce from farms around you — same-day fresh.',
    cta: 'Start shopping',
  },
  {
    to: '/login/seller',
    icon: 'potted_plant',
    mark: '02',
    tone: 'stitch-landing-path--farm',
    title: 'For farms',
    description: 'Open your storefront, manage harvest, and reach hungry neighbors.',
    cta: 'Sell on nurukk',
  },
  {
    to: '/login/delivery',
    icon: 'pedal_bike',
    mark: '03',
    tone: 'stitch-landing-path--rider',
    title: 'For riders',
    description: 'Pick up from farms, deliver to kitchens, earn on every route.',
    cta: 'Join delivery',
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
    <div className="stitch-landing stitch-auth-page flex min-h-dvh flex-col">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-margin-mobile py-5 md:px-margin-tablet">
          <Link to="/" className="flex items-center gap-3" aria-label={APP_NAME}>
            <BrandLogo size="sm" className="stitch-landing-logo-float h-10 w-auto max-w-[88px]" alt="" />
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">{APP_NAME}</span>
          </Link>
          <nav className="flex items-center gap-4">
            <a
              href="#join"
              className="hidden text-sm font-semibold text-white/80 transition-colors hover:text-white sm:inline"
            >
              Join
            </a>
            <Link
              to="/login/buyer"
              className="stitch-landing-cta rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            >
              Shop fresh
            </Link>
          </nav>
        </div>
      </header>

      <section className="stitch-landing-hero">
        <div className="stitch-landing-leaf-drift" aria-hidden>
          <span className="stitch-landing-leaf" />
          <span className="stitch-landing-leaf" />
          <span className="stitch-landing-leaf" />
          <span className="stitch-landing-leaf" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-margin-mobile pb-16 pt-28 md:px-margin-tablet md:pb-24 md:pt-16">
          <h1 className="stitch-landing-brand stitch-landing-enter mb-6">
            <span>{APP_NAME}</span>
          </h1>
          <p className="stitch-landing-headline stitch-landing-enter stitch-landing-enter-delay-1 mb-4">
            Morning harvest. Evening dinner.
          </p>
          <p className="stitch-landing-support stitch-landing-enter stitch-landing-enter-delay-2 mb-9">
            The marketplace that moves organic produce from local soil to your stove — while it still tastes like the farm.
          </p>
          <div className="stitch-landing-enter stitch-landing-enter-delay-3 flex flex-wrap items-center gap-3">
            <Link
              to="/login/buyer"
              className="stitch-landing-cta inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white"
            >
              Taste what&apos;s near
              <span className="material-symbols-outlined text-[20px]">north_east</span>
            </Link>
            <Link
              to="/register/seller"
              className="stitch-landing-cta-ghost inline-flex items-center rounded-full px-7 py-3.5 text-base font-semibold"
            >
              Grow with us
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-margin-mobile py-20 md:px-margin-tablet md:py-28">
        <div
          className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(252,130,12,0.14),transparent_70%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl md:mb-20">
            <h2 className="stitch-landing-section-title mb-4">
              From soil
              <br />
              to stove
            </h2>
            <p className="max-w-lg text-lg leading-relaxed text-on-surface-variant">
              No cold-chain limbo. Just a short, honest path between people who grow food and people who cook it.
            </p>
          </div>

          <ol className="stitch-landing-timeline grid gap-10 md:grid-cols-3 md:gap-8">
            {JOURNEY.map((step) => (
              <li key={step.title} className="flex gap-4 md:flex-col md:gap-5">
                <span className="stitch-landing-step-dot shrink-0">
                  <span className="material-symbols-outlined filled">{step.icon}</span>
                </span>
                <div>
                  <h3 className="mb-2 text-xl font-bold tracking-tight text-on-surface">{step.title}</h3>
                  <p className="text-base leading-relaxed text-on-surface-variant">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="join"
        className="scroll-mt-8 border-y border-primary/10 bg-[linear-gradient(180deg,#eef4ea_0%,#f7faf4_100%)] px-margin-mobile py-20 md:px-margin-tablet md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-xl md:mb-16">
            <h2 className="stitch-landing-section-title mb-3">Find your place in the harvest</h2>
            <p className="text-lg leading-relaxed text-on-surface-variant">
              Whether you cook, cultivate, or carry — there&apos;s a seat at the table.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PATHS.map((path) => (
              <Link key={path.to} to={path.to} className={`stitch-landing-path ${path.tone}`}>
                <span className="stitch-landing-path-mark" aria-hidden>
                  {path.mark}
                </span>
                <span className="stitch-landing-path-icon">
                  <span className="material-symbols-outlined filled">{path.icon}</span>
                </span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <span className="stitch-landing-path-cta">
                  {path.cta}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </span>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-on-surface-variant">
            New to nurukk?{' '}
            <Link to="/register/buyer" className="font-bold text-primary hover:opacity-80">
              Create a kitchen account
            </Link>
            <span className="mx-2 opacity-40">·</span>
            <Link to="/register/seller" className="font-bold text-primary hover:opacity-80">
              Register your farm
            </Link>
          </p>
        </div>
      </section>

      <section className="stitch-landing-close px-margin-mobile py-20 md:px-margin-tablet md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Tonight&apos;s dinner starts in a field.
            </h2>
            <p className="text-base leading-relaxed text-white/75 md:text-lg">
              Open nurukk, pick what&apos;s growing nearby, and let us close the distance.
            </p>
          </div>
          <Link
            to="/login/buyer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-primary shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Open the marketplace
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-primary/10 bg-[var(--landing-cream)] px-margin-mobile py-10 md:px-margin-tablet">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" className="h-9 w-auto max-w-[80px]" alt="" />
            <span className="font-bold tracking-tight text-primary">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-4">
            <a className="text-xs font-bold tracking-wide text-primary transition-opacity hover:opacity-70" href="#">
              Terms &amp; Conditions
            </a>
            <span className="h-1 w-1 rounded-full bg-primary/20" />
            <a className="text-xs font-bold tracking-wide text-primary transition-opacity hover:opacity-70" href="#">
              Privacy Policy
            </a>
          </div>
          <p className="text-xs tracking-[0.18em] text-on-surface-variant/50 uppercase">{appCopyright()}</p>
        </div>
      </footer>
    </div>
  )
}
