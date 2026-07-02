import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminPayoutsService } from '@/api/services'
import type { AdminPayoutRecord } from '@/types/payout'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

function payeeTypeLabel(type: string) {
  return type === 'delivery_agent' ? 'Delivery agent' : type === 'seller' ? 'Seller' : type
}

function statusBadge(status: string) {
  return cn(
    'text-label-md rounded-full px-3 py-1 font-semibold capitalize',
    status === 'completed' && 'bg-primary-container text-on-primary-container',
    status === 'pending' && 'bg-surface-container-high text-on-surface-variant',
    status === 'failed' && 'bg-error-container text-error',
  )
}

function PayoutDetailPanel({ payout, onClose }: { payout: AdminPayoutRecord; onClose: () => void }) {
  const payee = payout.payee

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 md:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6 stitch-card-shadow">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-headline-lg text-on-surface">{formatCurrency(payout.amount)}</h2>
            <p className="text-body-md text-on-surface-variant">
              {payeeTypeLabel(payout.payee_type)} payout · {payout.reference ?? payout.uuid.slice(0, 8)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-label-md text-on-surface-variant">Status</p>
            <span className={cn('mt-2 inline-block', statusBadge(payout.status))}>{payout.status}</span>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-label-md text-on-surface-variant">Period</p>
            <p className="text-body-md mt-1 text-on-surface">
              {payout.period_start && payout.period_end
                ? `${payout.period_start} → ${payout.period_end}`
                : payout.processed_at
                  ? new Date(payout.processed_at).toLocaleString('en-IN')
                  : '—'}
            </p>
          </div>
        </div>

        {payee ? (
          <div className="mb-6 rounded-xl border border-outline-variant/40 p-4">
            <h3 className="text-title-md mb-3 font-bold text-on-surface">Payee</h3>
            <dl className="grid gap-2 text-body-md sm:grid-cols-2">
              <div>
                <dt className="text-on-surface-variant">Name</dt>
                <dd className="font-medium text-on-surface">{payee.name ?? '—'}</dd>
              </div>
              {payee.store_name ? (
                <div>
                  <dt className="text-on-surface-variant">Store</dt>
                  <dd className="font-medium text-on-surface">{payee.store_name}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-on-surface-variant">Phone</dt>
                <dd className="font-medium text-on-surface">{payee.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Email</dt>
                <dd className="font-medium text-on-surface">{payee.email ?? '—'}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {payout.payout_account ? (
          <div className="mb-6 rounded-xl border border-outline-variant/40 p-4">
            <h3 className="text-title-md mb-3 font-bold text-on-surface">Transfer account</h3>
            <dl className="grid gap-2 text-body-md sm:grid-cols-2">
              <div>
                <dt className="text-on-surface-variant">Account holder</dt>
                <dd className="font-medium text-on-surface">{payout.payout_account.account_holder_name}</dd>
              </div>
              {payout.payout_account.upi_id ? (
                <div>
                  <dt className="text-on-surface-variant">UPI</dt>
                  <dd className="font-medium text-on-surface">{payout.payout_account.upi_id}</dd>
                </div>
              ) : null}
              {payout.payout_account.bank_account_number ? (
                <>
                  <div>
                    <dt className="text-on-surface-variant">Bank</dt>
                    <dd className="font-medium text-on-surface">{payout.payout_account.bank_name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Account</dt>
                    <dd className="font-medium text-on-surface">{payout.payout_account.bank_account_number}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">IFSC</dt>
                    <dd className="font-medium text-on-surface">{payout.payout_account.bank_ifsc ?? '—'}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </div>
        ) : (
          <p className="mb-6 rounded-xl bg-error-container/30 px-4 py-3 text-body-md text-error">
            No payout account on file — transfer could not complete.
          </p>
        )}

        {payout.failure_reason ? (
          <p className="mb-6 rounded-xl bg-error-container/30 px-4 py-3 text-body-md text-error">{payout.failure_reason}</p>
        ) : null}

        <div>
          <h3 className="text-title-md mb-3 font-bold text-on-surface">
            Orders ({payout.items?.length ?? payout.order_count ?? 0})
          </h3>
          <div className="space-y-2">
            {(payout.items ?? []).map((item, index) => (
              <div
                key={item.order_uuid ?? item.order_number ?? index}
                className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3"
              >
                <div>
                  <p className="text-body-md font-medium text-on-surface">{item.order_number ?? item.order_uuid?.slice(0, 8)}</p>
                  {item.description ? (
                    <p className="text-body-sm text-on-surface-variant">{item.description}</p>
                  ) : null}
                </div>
                <p className="text-body-md font-semibold text-on-surface">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminPayoutsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [payeeFilter, setPayeeFilter] = useState('')
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutRecord | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const { data: statsData } = useQuery({
    queryKey: ['admin', 'payouts', 'statistics'],
    queryFn: () => adminPayoutsService.getStatistics(),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'payouts', page, statusFilter, payeeFilter],
    queryFn: () =>
      adminPayoutsService.listPayouts({
        page,
        per_page: 15,
        status: statusFilter || undefined,
        payee_type: payeeFilter || undefined,
      }),
  })

  const runDeliveryMutation = useMutation({
    mutationFn: () => adminPayoutsService.runDeliveryPayouts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      setActionMessage('Delivery agent payouts processed.')
    },
    onError: (err) => setActionMessage(getApiErrorMessage(err, 'Failed to run delivery payouts')),
  })

  const runSellerMutation = useMutation({
    mutationFn: () => adminPayoutsService.runSellerPayouts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      setActionMessage('Seller payouts processed.')
    },
    onError: (err) => setActionMessage(getApiErrorMessage(err, 'Failed to run seller payouts')),
  })

  const stats = statsData?.data
  const rows = extractRows(data?.data) as AdminPayoutRecord[]
  const meta = extractPaginationMeta(data)

  const openDetail = async (payout: AdminPayoutRecord) => {
    try {
      const detail = await adminPayoutsService.getPayout(payout.uuid)
      setSelectedPayout(detail.data ?? payout)
    } catch {
      setSelectedPayout(payout)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-headline-xl text-on-surface">Payouts</h1>
          <p className="text-body-lg text-on-surface-variant">
            Platform settlement to sellers and delivery agents.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={runDeliveryMutation.isPending}
            onClick={() => runDeliveryMutation.mutate()}
            className="rounded-xl border border-primary px-4 py-2 text-label-md font-semibold text-primary disabled:opacity-50"
          >
            Run delivery payouts
          </button>
          <button
            type="button"
            disabled={runSellerMutation.isPending}
            onClick={() => runSellerMutation.mutate()}
            className="rounded-xl bg-primary px-4 py-2 text-label-md font-semibold text-on-primary disabled:opacity-50"
          >
            Run seller payouts
          </button>
        </div>
      </div>

      {actionMessage ? (
        <p className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-body-md text-on-surface">
          {actionMessage}
        </p>
      ) : null}

      {stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 stitch-card-shadow">
            <p className="text-label-md text-on-surface-variant">Total paid out</p>
            <p className="text-headline-lg text-on-surface">{formatCurrency(stats.total_paid_out)}</p>
            <p className="text-body-sm mt-1 text-on-surface-variant">
              Sellers {formatCurrency(stats.seller_paid_out)} · Agents {formatCurrency(stats.delivery_paid_out)}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 stitch-card-shadow">
            <p className="text-label-md text-on-surface-variant">Pending payouts</p>
            <p className="text-headline-lg text-secondary">{formatCurrency(stats.pending_payouts)}</p>
            <p className="text-body-sm mt-1 text-on-surface-variant">
              {stats.payout_counts.pending} pending · {stats.payout_counts.failed} failed
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 stitch-card-shadow">
            <p className="text-label-md text-on-surface-variant">Unsettled earnings</p>
            <p className="text-headline-lg text-on-surface">
              {formatCurrency(stats.unsettled_upcoming.seller + stats.unsettled_upcoming.delivery_agent)}
            </p>
            <p className="text-body-sm mt-1 text-on-surface-variant">
              Not yet in a payout batch
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 stitch-card-shadow">
            <p className="text-label-md text-on-surface-variant">Platform fees</p>
            <p className="text-headline-lg text-primary">{formatCurrency(stats.platform_fees_collected)}</p>
            <p className="text-body-sm mt-1 text-on-surface-variant">
              {stats.payees_missing_account.sellers + stats.payees_missing_account.delivery_agents} payees missing account
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-xl border border-outline px-4 py-2 text-body-md"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={payeeFilter}
          onChange={(e) => {
            setPayeeFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-xl border border-outline px-4 py-2 text-body-md"
        >
          <option value="">All payees</option>
          <option value="seller">Sellers</option>
          <option value="delivery_agent">Delivery agents</option>
        </select>
      </div>

      {error ? (
        <p className="text-sm text-error">{getApiErrorMessage(error, 'Failed to load payouts')}</p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface stitch-card-shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 text-on-surface">Payee</th>
              <th className="px-4 py-3 text-on-surface">Type</th>
              <th className="px-4 py-3 text-on-surface">Amount</th>
              <th className="px-4 py-3 text-on-surface">Status</th>
              <th className="px-4 py-3 text-on-surface">Period</th>
              <th className="px-4 py-3 text-on-surface">Reference</th>
              <th className="px-4 py-3 text-on-surface" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                  No payouts yet
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.uuid} className="border-t border-outline-variant/40 hover:bg-surface-container-low/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{row.payee?.name ?? '—'}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {row.payee?.store_name ?? row.payee?.phone ?? row.payee?.email ?? ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize text-on-surface">{payeeTypeLabel(row.payee_type)}</td>
                  <td className="px-4 py-3 font-semibold text-on-surface">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(row.status)}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {row.period_start && row.period_end ? `${row.period_start} → ${row.period_end}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{row.reference ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openDetail(row)}
                      className="text-label-md font-bold text-primary hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}

      {selectedPayout ? <PayoutDetailPanel payout={selectedPayout} onClose={() => setSelectedPayout(null)} /> : null}
    </div>
  )
}
