import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ADMIN_USER_ROLES,
  blockUser,
  getUser,
  unblockUser,
  type AdminUser,
} from '@/api/services/adminUsersService'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-label-md text-on-surface-variant">{label}</p>
      <p className="text-body-md font-medium text-on-surface">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 stitch-card-shadow">
      <h2 className="text-headline-lg mb-4 border-b border-outline-variant/20 pb-3 text-on-surface">{title}</h2>
      {children}
    </section>
  )
}

function roleLabel(role: string) {
  return ADMIN_USER_ROLES.find((r) => r.value === role)?.label ?? role.replace(/_/g, ' ')
}

export function AdminUserDetailPage() {
  const { uuid = '' } = useParams()
  const queryClient = useQueryClient()
  const [blockReason, setBlockReason] = useState('')
  const [showBlockForm, setShowBlockForm] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', uuid],
    queryFn: () => getUser(uuid),
    enabled: Boolean(uuid),
  })

  const blockMutation = useMutation({
    mutationFn: () => blockUser(uuid, blockReason.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setShowBlockForm(false)
      setBlockReason('')
    },
  })

  const unblockMutation = useMutation({
    mutationFn: () => unblockUser(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const user = data?.data as AdminUser | undefined
  const stats = user?.stats
  const buyerOrders = user?.recent_orders?.as_buyer ?? []
  const sellerOrders = user?.recent_orders?.as_seller ?? []

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link to="/admin/users" className="text-label-md inline-flex items-center gap-1 font-bold text-primary hover:underline">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to users
      </Link>

      {isLoading ? <div className="h-40 animate-pulse rounded-xl bg-surface-container" /> : null}

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-body-md text-error">
          {getApiErrorMessage(error, 'Failed to load user')}
        </p>
      ) : null}

      {user ? (
        <>
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-label-md font-bold text-primary">USER</p>
              <h1 className="text-headline-xl text-on-surface">{user.name ?? 'Unnamed user'}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-label-md capitalize text-on-surface">
                  {roleLabel(user.role)}
                </span>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-label-md font-semibold',
                    user.is_blocked ? 'bg-error-container text-error' : 'bg-primary-container/20 text-primary',
                  )}
                >
                  {user.is_blocked ? 'Blocked' : 'Active'}
                </span>
                {user.created_at ? (
                  <span className="text-body-md text-on-surface-variant">
                    Joined {formatOrderDateTime(user.created_at)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {user.is_blocked ? (
                <button
                  type="button"
                  disabled={unblockMutation.isPending}
                  onClick={() => unblockMutation.mutate()}
                  className="rounded-xl border border-primary px-4 py-2.5 font-semibold text-primary disabled:opacity-50"
                >
                  {unblockMutation.isPending ? 'Unblocking…' : 'Unblock user'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBlockForm((v) => !v)}
                  className="rounded-xl bg-error px-4 py-2.5 font-semibold text-on-error"
                >
                  Block user
                </button>
              )}
            </div>
          </header>

          {showBlockForm && !user.is_blocked ? (
            <div className="rounded-xl border border-error/30 bg-error-container/20 p-4">
              <label className="block">
                <span className="text-label-md text-on-surface-variant">Block reason (optional)</span>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-outline px-4 py-2.5 text-body-md"
                  placeholder="Reason for blocking this account"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={blockMutation.isPending}
                  onClick={() => blockMutation.mutate()}
                  className="rounded-xl bg-error px-4 py-2 font-semibold text-on-error disabled:opacity-50"
                >
                  {blockMutation.isPending ? 'Blocking…' : 'Confirm block'}
                </button>
                <button type="button" onClick={() => setShowBlockForm(false)} className="rounded-xl border border-outline px-4 py-2">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {user.is_blocked && user.block_reason ? (
            <p className="rounded-xl border border-error/20 bg-error-container/30 px-4 py-3 text-body-md text-error">
              Block reason: {user.block_reason}
            </p>
          ) : null}

          {(blockMutation.isError || unblockMutation.isError) && (
            <p className="text-body-md text-error">
              {getApiErrorMessage(blockMutation.error ?? unblockMutation.error, 'Action failed')}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Buyer orders', value: stats?.orders_as_buyer ?? 0 },
              { label: 'Seller orders', value: stats?.orders_as_seller ?? 0 },
              { label: 'Deliveries', value: stats?.deliveries ?? 0 },
              { label: 'Products', value: stats?.products ?? 0 },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-label-md text-on-surface-variant">{card.label}</p>
                <p className="text-headline-lg text-on-surface">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="Account">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="UUID" value={user.uuid} />
                <DetailRow label="Phone" value={user.phone} />
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Email verified" value={user.email_verified_at ? formatOrderDateTime(user.email_verified_at) : 'Not verified'} />
                <DetailRow label="Last updated" value={user.updated_at ? formatOrderDateTime(user.updated_at) : undefined} />
                <DetailRow label="Addresses saved" value={String(stats?.addresses ?? 0)} />
                <DetailRow label="Notifications" value={String(stats?.notifications ?? 0)} />
              </div>
            </Section>

            {user.seller_profile ? (
              <Section title="Seller profile">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Store name" value={String(user.seller_profile.name ?? user.seller_profile.store_name ?? '')} />
                  <DetailRow label="Status" value={String(user.seller_profile.status ?? '')} />
                  <DetailRow label="City" value={String(user.seller_profile.city ?? '')} />
                  <DetailRow label="Pincode" value={String(user.seller_profile.pincode ?? '')} />
                  <DetailRow label="Address" value={String(user.seller_profile.address_line ?? '')} />
                  <DetailRow
                    label="Delivery options"
                    value={[
                      user.seller_profile.offers_own_delivery ? 'Own delivery' : null,
                      user.seller_profile.offers_platform_delivery ? 'Platform delivery' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || undefined}
                  />
                  {user.seller_profile.approval_notes ? (
                    <div className="sm:col-span-2">
                      <DetailRow label="Approval notes" value={String(user.seller_profile.approval_notes)} />
                    </div>
                  ) : null}
                </div>
              </Section>
            ) : null}

            {user.delivery_profile ? (
              <Section title="Delivery profile">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Display name" value={String(user.delivery_profile.display_name ?? '')} />
                  <DetailRow label="Type" value={String(user.delivery_profile.type ?? '')} />
                  <DetailRow label="Phone" value={String(user.delivery_profile.phone ?? '')} />
                  <DetailRow label="Vehicle" value={String(user.delivery_profile.vehicle_type ?? '')} />
                  <DetailRow label="Available" value={user.delivery_profile.is_available ? 'Yes' : 'No'} />
                  <DetailRow label="Active" value={user.delivery_profile.is_active ? 'Yes' : 'No'} />
                </div>
              </Section>
            ) : null}

            {user.payout_account ? (
              <Section title="Payout account">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Account holder" value={String(user.payout_account.account_holder_name ?? '')} />
                  <DetailRow label="UPI" value={String(user.payout_account.upi_id ?? '')} />
                  <DetailRow label="Bank" value={String(user.payout_account.bank_name ?? '')} />
                  <DetailRow label="Account number" value={String(user.payout_account.bank_account_number ?? '')} />
                  <DetailRow label="IFSC" value={String(user.payout_account.bank_ifsc ?? '')} />
                </div>
              </Section>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="Recent buyer orders">
              {buyerOrders.length === 0 ? (
                <p className="text-body-md text-on-surface-variant">No orders as buyer.</p>
              ) : (
                <div className="space-y-2">
                  {buyerOrders.map((order) => (
                    <Link
                      key={String(order.uuid)}
                      to={`/admin/orders/${String(order.uuid)}`}
                      className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3 hover:bg-surface-container"
                    >
                      <div>
                        <p className="text-body-md font-semibold text-on-surface">
                          #{String(order.order_number ?? order.uuid)}
                        </p>
                        <p className="text-body-sm capitalize text-on-surface-variant">{String(order.status)}</p>
                      </div>
                      <p className="text-body-md font-semibold text-on-surface">
                        {formatCurrency(Number(order.total ?? 0))}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Recent seller orders">
              {sellerOrders.length === 0 ? (
                <p className="text-body-md text-on-surface-variant">No orders as seller.</p>
              ) : (
                <div className="space-y-2">
                  {sellerOrders.map((order) => (
                    <Link
                      key={String(order.uuid)}
                      to={`/admin/orders/${String(order.uuid)}`}
                      className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3 hover:bg-surface-container"
                    >
                      <div>
                        <p className="text-body-md font-semibold text-on-surface">
                          #{String(order.order_number ?? order.uuid)}
                        </p>
                        <p className="text-body-sm capitalize text-on-surface-variant">{String(order.status)}</p>
                      </div>
                      <p className="text-body-md font-semibold text-on-surface">
                        {formatCurrency(Number(order.total ?? 0))}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </>
      ) : null}
    </div>
  )
}
