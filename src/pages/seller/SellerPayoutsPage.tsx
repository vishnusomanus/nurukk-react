import * as sellerService from '@/api/services/sellerService'
import { PayoutPanel } from '@/components/payout/PayoutPanel'

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
  return (
    <div className="stitch-marketplace px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-3xl space-y-2">
        <h2 className="text-headline-xl text-on-surface">Payouts</h2>
        <p className="text-body-md text-on-surface-variant">
          Your share of item sales (after discounts) is transferred automatically each week.
        </p>
        <div className="pt-4">
          <PayoutPanel api={sellerPayoutApi} />
        </div>
      </div>
    </div>
  )
}
