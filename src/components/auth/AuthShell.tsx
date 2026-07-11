import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { APP_NAME, appCopyright } from '@/constants/app'
import { cn } from '@/utils/cn'

const AUTH_BG =
  'https://lh3.googleusercontent.com/aida/AP1WRLsd_QYWfHn6k3-0aq-CNZiXvAKUc-nBn9SMPok7ni8_dIq7g8NQpSxaPkVLJfPyADiTp9BO9mkrZqmO9dVkEBcmNVZSJ6sI_UXxcGkdKYhgOa70MsoePPWzV2sKG88v__2kQea2FTj192_5jTvVvidFeP2zJHZi7DToQJpah3HGJqPJ-FjLyMu--07v9OyIf5FNZM_-htqvh9bj6CHO2zrPearkghn0M3rFhk_OW407N8TnjjaulDXKnys'

export function AuthShell({
  children,
  title,
  subtitle,
  variant = 'default',
}: {
  children: React.ReactNode
  title: string
  subtitle: string
  variant?: 'default' | 'premium-login'
}) {
  const isPremiumLogin = variant === 'premium-login'

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url('${AUTH_BG}')` }}
        aria-hidden
      />
      <div
        className={cn(
          'fixed inset-0',
          isPremiumLogin
            ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.8)_100%)]'
            : 'bg-gradient-to-b from-white/40 to-white/80 dark:from-zinc-950/60 dark:to-zinc-950/90',
        )}
        aria-hidden
      />

      <div
        className={cn(
          'relative z-10 mx-auto flex min-h-screen flex-col',
          isPremiumLogin
            ? 'w-full max-w-md items-center px-4 pt-12 pb-16'
            : 'w-full max-w-lg px-4 py-10 md:max-w-5xl md:flex-row md:items-center md:gap-12 md:px-8',
        )}
      >
        <header
          className={cn(
            'flex flex-col items-center text-center',
            isPremiumLogin ? 'mb-12' : 'mb-10 md:mb-0 md:flex-1 md:items-start md:text-left',
          )}
        >
          <div className={cn('relative', isPremiumLogin ? 'mb-6' : 'mb-6')}>
            <BrandLogo kind="buyer" size="lg" />
          </div>
          <h1
            className={cn(
              'font-bold tracking-tight text-emerald-900 dark:text-emerald-100',
              isPremiumLogin ? 'mb-2 text-3xl' : 'text-3xl',
            )}
          >
            {APP_NAME}
          </h1>
          <p
            className={cn(
              'font-medium leading-relaxed text-zinc-600 dark:text-zinc-300',
              isPremiumLogin ? 'max-w-[280px] text-base' : 'mt-2 max-w-sm text-base',
            )}
          >
            Premium organic produce from farm to your kitchen table.
          </p>
        </header>

        <div className={cn('w-full', isPremiumLogin ? 'max-w-md' : 'md:max-w-md md:flex-1')}>
          <div
            className={cn(
              'border border-white/40 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70',
              isPremiumLogin
                ? 'rounded-[2rem] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]'
                : 'rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
            )}
          >
            <div className={cn(isPremiumLogin ? 'sr-only' : 'mb-6')}>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
            </div>
            {children}
          </div>

          <div
            className={cn(
              'text-center',
              isPremiumLogin ? 'mt-auto flex w-full max-w-md flex-col gap-2 px-4 pb-8 pt-8' : 'mt-6',
            )}
          >
            <p
              className={cn(
                'text-zinc-500 dark:text-zinc-400',
                isPremiumLogin ? 'text-sm font-medium text-zinc-600' : 'text-xs',
              )}
            >
              By continuing, you agree to our
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link to="#" className="font-bold text-emerald-800 transition-opacity hover:opacity-70 dark:text-emerald-300">
                Terms &amp; Conditions
              </Link>
              <span className="h-1 w-1 rounded-full bg-emerald-800/20" />
              <Link to="#" className="font-bold text-emerald-800 transition-opacity hover:opacity-70 dark:text-emerald-300">
                Privacy Policy
              </Link>
            </div>
            {isPremiumLogin ? (
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500/60">{appCopyright()}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthTabs<T extends string>({
  active,
  onChange,
  tabs,
}: {
  active: T
  onChange: (tab: T) => void
  tabs: { id: T; label: string }[]
}) {
  return (
    <div className="mb-6 flex rounded-xl bg-zinc-100/80 p-1 dark:bg-white/5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition',
            active === tab.id
              ? 'bg-white text-emerald-900 shadow-sm dark:bg-zinc-800 dark:text-emerald-100'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
      {message}
    </div>
  )
}

export function PremiumButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-base font-bold text-white shadow-[0_10px_20px_-5px_rgba(13,99,27,0.4)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
