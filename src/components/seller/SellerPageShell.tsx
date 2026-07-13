import { cn } from '@/utils/cn'
import { isSellerBottomNavHidden } from '@/components/seller/SellerBottomNav'

export function SellerPageShell({
  children,
  className,
  pathname,
  ctaPad = false,
}: {
  children: React.ReactNode
  className?: string
  /** Current path — used to pick bottom padding when tab bar is hidden. */
  pathname?: string
  /** Extra space for a sticky bottom CTA (forms / detail). */
  ctaPad?: boolean
}) {
  const hideNav = pathname ? isSellerBottomNavHidden(pathname) : false
  const bottomPad = ctaPad
    ? 'app-page-pad-bottom-cta'
    : hideNav
      ? 'pb-[max(1.5rem,env(safe-area-inset-bottom))]'
      : 'app-page-pad-bottom'

  return (
    <div className={cn('seller-page-container space-y-4 lg:space-y-6 lg:pt-2', bottomPad, className)}>
      {children}
    </div>
  )
}
