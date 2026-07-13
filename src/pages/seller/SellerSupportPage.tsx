import { Link, useLocation } from 'react-router-dom'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import { HelpSupportForm } from '@/components/common/HelpSupportForm'

export function SellerSupportPage() {
  const location = useLocation()

  return (
    <SellerPageShell pathname={location.pathname}>
      <div className="mx-auto w-full max-w-2xl space-y-4 lg:space-y-6">
        <div className="flex items-start gap-2 lg:block">
          <Link
            to="/seller/profile"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-low lg:hidden"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-on-surface lg:text-headline-xl">Help & Support</h1>
            <p className="mt-1 text-sm text-on-surface-variant lg:text-body-lg">
              Reach the team about store, payout, or product issues.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest px-4 py-5 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:bg-surface lg:p-6 lg:shadow-none">
          <HelpSupportForm app="seller" />
        </div>
      </div>
    </SellerPageShell>
  )
}
