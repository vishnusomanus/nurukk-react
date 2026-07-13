import { useLocation } from 'react-router-dom'
import * as sellerService from '@/api/services/sellerService'
import { PayoutPanel } from '@/components/payout/PayoutPanel'
import { SellerPageShell } from '@/components/seller/SellerPageShell'

const sellerPayoutApi = {
  getSummary: sellerService.getPayoutSummary,
  listPayouts: sellerService.listPayouts,
  getPayout: sellerService.getPayout,
  getAccount: sellerService.getPayoutAccount,
  saveAccount: sellerService.savePayoutAccount,
  queryKeyPrefix: 'seller',
  scheduleLabel: 'Weekly on Monday for orders delivered the previous week (processed at 6:00 AM).',
  nextPayoutAtKey: 'next_seller_payout_at' as const,
}

export function SellerPayoutsPage() {
  const location = useLocation()
  return (
    <SellerPageShell pathname={location.pathname} className="space-y-3 lg:max-w-3xl lg:space-y-4">
      <div className="hidden lg:block">
        <h2 className="text-headline-xl text-primary">Payouts</h2>
        <p className="text-body-md text-on-surface-variant">
          Your share of item sales is transferred automatically each week.
        </p>
      </div>
      <PayoutPanel api={sellerPayoutApi} />
    </SellerPageShell>
  )
}
