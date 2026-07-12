import { BreadcrumbBackButton } from '@/components/common/BreadcrumbBack'
import { cn } from '@/utils/cn'

export function BuyerPageHeader({
  title,
  backTo,
  showBack = true,
  right,
  className,
}: {
  title: string
  backTo?: string | null
  /** Set false on tab roots (Home / Orders / Profile / Categories). */
  showBack?: boolean
  right?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'app-header-safe fixed top-0 left-0 right-0 z-40 w-full bg-surface shadow-sm lg:hidden',
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between gap-2 px-3 sm:h-16 sm:px-margin-mobile">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          {showBack ? (
            <BreadcrumbBackButton backTo={backTo} />
          ) : (
            <span className="h-10 w-1 shrink-0" aria-hidden />
          )}
          <h1 className="truncate text-base font-bold text-primary sm:text-xl">{title}</h1>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  )
}
