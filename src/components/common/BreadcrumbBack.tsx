import { Link, useLocation } from 'react-router-dom'
import { resolveBreadcrumbBack } from '@/utils/breadcrumbBack'
import { cn } from '@/utils/cn'

type LocationFromState = {
  from?: string
}

export function BreadcrumbBackButton({
  backTo,
  showBack = true,
  className,
  iconClassName,
}: {
  /** Explicit parent; otherwise resolved from the route hierarchy. */
  backTo?: string | null
  showBack?: boolean
  className?: string
  iconClassName?: string
}) {
  const location = useLocation()
  const from = (location.state as LocationFromState | null)?.from
  const target = backTo ?? resolveBreadcrumbBack(location.pathname, from)

  if (!showBack || !target) return null

  return (
    <Link
      to={target}
      replace={false}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 hover:bg-surface-container-low',
        className,
      )}
      aria-label="Go back"
    >
      <span className={cn('material-symbols-outlined text-primary', iconClassName)}>arrow_back</span>
    </Link>
  )
}

/** Text-style breadcrumb back link for desktop / admin pages. */
export function BreadcrumbBackLink({
  backTo,
  label = 'Back',
  className,
}: {
  backTo?: string | null
  label?: string
  className?: string
}) {
  const location = useLocation()
  const from = (location.state as LocationFromState | null)?.from
  const target = backTo ?? resolveBreadcrumbBack(location.pathname, from)

  if (!target) return null

  return (
    <Link
      to={target}
      className={cn(
        'text-label-md inline-flex items-center gap-1 font-bold text-primary hover:underline',
        className,
      )}
    >
      <span className="material-symbols-outlined text-sm">arrow_back</span>
      {label}
    </Link>
  )
}
