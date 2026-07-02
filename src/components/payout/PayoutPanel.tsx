import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { PayoutAccountPayload, PayoutRecord } from '@/types/payout'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type PayoutApi = {
  getSummary: () => Promise<{ data?: import('@/types/payout').PayoutSummary | null }>
  listPayouts: (params?: { page?: number; per_page?: number }) => Promise<{ data?: PayoutRecord[] }>
  getAccount: () => Promise<{ data?: import('@/types/payout').PayoutAccount | null }>
  saveAccount: (payload: PayoutAccountPayload) => Promise<unknown>
  getPayout?: (uuid: string) => Promise<{ data?: PayoutRecord | null }>
  queryKeyPrefix: string
  scheduleLabel: string
  nextPayoutAtKey?: 'next_seller_payout_at' | 'next_delivery_payout_at'
}

function payoutStatusLabel(status: string) {
  switch (status) {
    case 'completed':
      return 'Paid'
    case 'pending':
      return 'Pending'
    case 'failed':
      return 'Failed'
    default:
      return status
  }
}

function PayoutHistoryRow({
  payout,
  api,
}: {
  payout: PayoutRecord
  api: PayoutApi
}) {
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<PayoutRecord | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const items = detail?.items ?? payout.items ?? []

  const toggle = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }

    if (api.getPayout && (!payout.items || payout.items.length === 0)) {
      setLoadingDetail(true)
      try {
        const response = await api.getPayout(payout.uuid)
        setDetail(response.data ?? payout)
      } catch {
        setDetail(payout)
      } finally {
        setLoadingDetail(false)
      }
    }

    setExpanded(true)
  }

  return (
    <div className="rounded-xl border border-outline-variant/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-title-sm font-bold text-on-surface">{formatCurrency(payout.amount)}</p>
          <p className="text-body-sm text-on-surface-variant">
            {payout.period_start && payout.period_end
              ? `${payout.period_start} → ${payout.period_end}`
              : payout.processed_at
                ? new Date(payout.processed_at).toLocaleDateString('en-IN')
                : 'Scheduled'}
            {payout.order_count ? ` · ${payout.order_count} orders` : ''}
          </p>
          {payout.reference ? (
            <p className="text-label-md mt-1 text-on-surface-variant">Ref: {payout.reference}</p>
          ) : null}
          {payout.failure_reason ? (
            <p className="text-body-sm mt-1 text-error">{payout.failure_reason}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-label-md rounded-full px-3 py-1 font-semibold capitalize',
              payout.status === 'completed' && 'bg-primary-container text-on-primary-container',
              payout.status === 'pending' && 'bg-surface-container-high text-on-surface-variant',
              payout.status === 'failed' && 'bg-error-container text-error',
            )}
          >
            {payoutStatusLabel(payout.status)}
          </span>
          {(payout.order_count ?? items.length) > 0 || api.getPayout ? (
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-low"
              aria-expanded={expanded}
            >
              <span className="material-symbols-outlined text-sm">
                {loadingDetail ? 'progress_activity' : expanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {expanded && items.length > 0 ? (
        <div className="mt-4 space-y-2 border-t border-outline-variant/30 pt-4">
          <p className="text-label-md font-semibold text-on-surface-variant">Included orders</p>
          {items.map((item, index) => (
            <div
              key={item.order_uuid ?? item.order_number ?? index}
              className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2"
            >
              <div>
                <p className="text-body-sm font-medium text-on-surface">
                  {item.order_number ?? item.order_uuid?.slice(0, 8)}
                </p>
                {item.description ? (
                  <p className="text-body-sm text-on-surface-variant">{item.description}</p>
                ) : null}
              </div>
              <p className="text-body-sm font-semibold text-on-surface">{formatCurrency(item.amount)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function PayoutPanel({ api }: { api: PayoutApi }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PayoutAccountPayload>({
    account_holder_name: '',
    upi_id: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: summaryData } = useQuery({
    queryKey: [api.queryKeyPrefix, 'payouts', 'summary'],
    queryFn: () => api.getSummary(),
  })

  const { data: accountData } = useQuery({
    queryKey: [api.queryKeyPrefix, 'payout-account'],
    queryFn: () => api.getAccount(),
  })

  const { data: payoutsData, isLoading } = useQuery({
    queryKey: [api.queryKeyPrefix, 'payouts', 'list'],
    queryFn: () => api.listPayouts({ per_page: 20 }),
  })

  const account = accountData?.data ?? summaryData?.data?.payout_account ?? null
  const summary = summaryData?.data
  const payouts = payoutsData?.data ?? []
  const nextPayoutAt = api.nextPayoutAtKey ? summary?.[api.nextPayoutAtKey] : undefined

  const saveMutation = useMutation({
    mutationFn: () => api.saveAccount(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.queryKeyPrefix] })
      setFormError(null)
      setShowForm(false)
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Failed to save payout account')),
  })

  const openForm = () => {
    setForm({
      account_holder_name: account?.account_holder_name ?? '',
      upi_id: account?.upi_id ?? '',
      bank_name: account?.bank_name ?? '',
      bank_account_number: '',
      bank_ifsc: account?.bank_ifsc ?? '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5 stitch-card-shadow">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-headline-lg text-on-surface">Automated payouts</h3>
            <p className="text-body-md mt-1 text-on-surface-variant">{api.scheduleLabel}</p>
            {nextPayoutAt ? (
              <p className="text-body-sm mt-2 text-on-surface-variant">
                Next scheduled run: {new Date(nextPayoutAt).toLocaleString('en-IN')}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={openForm}
            className="text-label-md rounded-xl border border-primary px-4 py-2 font-semibold text-primary"
          >
            {account?.has_transfer_details ? 'Update payout account' : 'Add payout account'}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-label-md text-on-surface-variant">Total paid out</p>
            <p className="text-headline-lg mt-1 font-bold text-on-surface">
              {formatCurrency(summary?.total_paid_out ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-label-md text-on-surface-variant">Pending payout</p>
            <p className="text-headline-lg mt-1 font-bold text-secondary">
              {formatCurrency(summary?.pending_payout ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-label-md text-on-surface-variant">Upcoming earnings</p>
            <p className="text-headline-lg mt-1 font-bold text-on-surface">
              {formatCurrency(summary?.upcoming_earnings ?? 0)}
            </p>
            <p className="text-body-sm mt-1 text-on-surface-variant">Eligible, not yet settled</p>
          </div>
        </div>

        {account?.has_transfer_details ? (
          <p className="text-body-sm mt-4 text-on-surface-variant">
            Payouts go to {account.upi_id ? `UPI ${account.upi_id}` : `bank •••• ${account.bank_account_number?.slice(-4) ?? ''}`}{' '}
            ({account.account_holder_name})
          </p>
        ) : (
          <p className="text-body-sm mt-4 text-error">
            Add UPI or bank details to receive automated transfers.
          </p>
        )}
      </div>

      {showForm ? (
        <form
          className="rounded-2xl border border-outline-variant/40 bg-surface p-5 stitch-card-shadow space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <h4 className="text-title-md font-bold">Payout account</h4>
          <label className="block">
            <span className="text-label-md text-on-surface-variant">Account holder name</span>
            <input
              required
              value={form.account_holder_name}
              onChange={(e) => setForm((f) => ({ ...f, account_holder_name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-outline px-4 py-2.5"
            />
          </label>
          <label className="block">
            <span className="text-label-md text-on-surface-variant">UPI ID</span>
            <input
              value={form.upi_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, upi_id: e.target.value }))}
              placeholder="name@upi"
              className="mt-1 w-full rounded-xl border border-outline px-4 py-2.5"
            />
          </label>
          <p className="text-body-sm text-on-surface-variant">Or bank transfer</p>
          <label className="block">
            <span className="text-label-md text-on-surface-variant">Bank name</span>
            <input
              value={form.bank_name ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-outline px-4 py-2.5"
            />
          </label>
          <label className="block">
            <span className="text-label-md text-on-surface-variant">Account number</span>
            <input
              value={form.bank_account_number ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, bank_account_number: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-outline px-4 py-2.5"
            />
          </label>
          <label className="block">
            <span className="text-label-md text-on-surface-variant">IFSC</span>
            <input
              value={form.bank_ifsc ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, bank_ifsc: e.target.value.toUpperCase() }))}
              className="mt-1 w-full rounded-xl border border-outline px-4 py-2.5"
            />
          </label>
          {formError ? <p className="text-sm text-error">{formError}</p> : null}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-on-primary disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save account'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-outline px-5 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5 stitch-card-shadow">
        <h3 className="text-headline-lg mb-4 text-on-surface">Payout history</h3>
        {isLoading ? (
          <p className="text-body-md text-on-surface-variant">Loading…</p>
        ) : payouts.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No payouts yet. Completed orders will be settled automatically.</p>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <PayoutHistoryRow key={payout.uuid} payout={payout} api={api} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
