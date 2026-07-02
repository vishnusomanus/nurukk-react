import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminDashboardService, adminOrdersService, adminSellersService } from '@/api/services'
import type { AdminOrder } from '@/api/services/adminOrdersService'
import type { AdminSeller } from '@/api/services/adminSellersService'
import { AdminSellerUrgentRow } from '@/components/admin/AdminSellerCard'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'
import { extractRows } from '@/utils/extractRows'
import { APP_NAME } from '@/constants/app'
import { cn } from '@/utils/cn'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Today']

function PlatformChart() {
  const bars = [30, 45, 35, 60, 50, 80, 75, 95]
  return (
    <div className="relative flex flex-1 flex-col justify-end p-6">
      <div className="pointer-events-none absolute inset-x-6 top-6 bottom-16 flex items-end justify-between gap-2 opacity-20">
        {bars.map((height, index) => (
          <div key={index} className="w-full rounded-t-lg bg-primary/20" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="admin-chart-gradient pointer-events-none absolute inset-0" />
      <div className="relative flex justify-between border-t border-outline-variant/30 pt-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={label} className={cn(index === 7 && 'text-primary')}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminDashboardService.getDashboard(),
  })

  const { data: pendingSellersData } = useQuery({
    queryKey: ['admin', 'sellers', 'pending'],
    queryFn: () => adminSellersService.listSellers({ status: 'pending', per_page: 5 }),
  })

  const { data: recentOrdersData } = useQuery({
    queryKey: ['admin', 'orders', 'recent'],
    queryFn: () => adminOrdersService.listOrders({ page: 1, per_page: 5 }),
  })

  const stats = data?.data
  const pendingSellers = extractRows(pendingSellersData?.data) as AdminSeller[]
  const recentOrders = extractRows(recentOrdersData?.data) as AdminOrder[]
  const pendingCount = pendingSellers.length

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-xl text-on-surface">Platform Overview</h2>
          <p className="text-body-lg text-on-surface-variant">
            Real-time health and transaction data for {APP_NAME}.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-6 py-2 text-label-md transition-all hover:bg-surface-variant/30"
          >
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Last 30 Days
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load dashboard')}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-primary/5 bg-surface-container-lowest p-6 stitch-card-shadow">
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-primary-container/20 p-2 text-primary">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-label-md tracking-wider text-on-surface-variant uppercase">Total Revenue</p>
            <h3 className="text-headline-xl text-on-surface">
              {isLoading ? '—' : formatCurrency(stats?.total_sales)}
            </h3>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-variant">
            <div className="h-full w-[74%] bg-primary" />
          </div>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-secondary/5 bg-surface-container-lowest p-6 stitch-card-shadow">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-secondary-container/20 p-2 text-secondary">
              <span className="material-symbols-outlined">groups</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-label-md tracking-wider text-on-surface-variant uppercase">Active Sellers</p>
            <h3 className="text-headline-xl text-on-surface">
              {isLoading ? '—' : (stats?.active_sellers ?? 0)}
            </h3>
          </div>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-error/5 bg-surface-container-lowest p-6 stitch-card-shadow">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-error-container/20 p-2 text-error">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                assignment_late
              </span>
            </div>
            {pendingCount > 0 ? (
              <span className="rounded-full bg-error-container px-3 py-1 text-[10px] font-bold tracking-tight text-on-error-container uppercase">
                Priority High
              </span>
            ) : null}
          </div>
          <div>
            <p className="mb-1 text-label-md tracking-wider text-on-surface-variant uppercase">
              Pending Verifications
            </p>
            <h3 className="text-headline-xl text-on-surface">{pendingCount}</h3>
          </div>
          <Link to="/admin/sellers" className="mt-4 flex items-center gap-1 text-label-md font-bold text-primary hover:underline">
            Review Now
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex h-[500px] flex-col overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest stitch-card-shadow lg:col-span-8">
          <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
            <div>
              <h4 className="text-headline-lg text-on-surface">Platform Health</h4>
              <p className="text-body-md text-on-surface-variant">Aggregate uptime and transactional velocity.</p>
            </div>
            <div className="rounded-lg bg-surface-container p-1">
              <span className="rounded-md bg-surface-container-lowest px-4 py-1 text-label-md font-bold text-primary shadow-sm">
                Revenue
              </span>
            </div>
          </div>
          <PlatformChart />
        </div>

        <div className="flex max-h-[500px] flex-col rounded-xl border border-outline-variant/20 bg-surface-container-lowest stitch-card-shadow lg:col-span-4">
          <div className="border-b border-outline-variant/10 p-6">
            <h4 className="text-headline-lg text-on-surface">Urgent Actions</h4>
            <p className="text-body-md text-on-surface-variant">Items requiring manual intervention.</p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4 stitch-scrollbar">
            {pendingSellers.length === 0 ? (
              <p className="p-4 text-body-md text-on-surface-variant">No pending seller verifications.</p>
            ) : (
              pendingSellers.map((seller) => <AdminSellerUrgentRow key={seller.uuid} seller={seller} />)
            )}
          </div>
          <div className="border-t border-outline-variant/10 p-4 text-center">
            <Link to="/admin/sellers" className="text-label-md font-bold text-primary hover:underline">
              View All Verifications
            </Link>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest stitch-card-shadow">
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <h4 className="text-headline-lg text-on-surface">Recent System Activity</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50">
                {['Type', 'Subject', 'Timestamp', 'Amount', ''].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-label-md font-bold tracking-widest text-on-surface-variant uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-body-md text-on-surface-variant">
                    No recent orders.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.uuid} className="transition-colors hover:bg-surface-container-low">
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary uppercase">
                        Order
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface">
                      {order.order_number ?? order.uuid.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">
                      {formatOrderDateTime(
                        typeof order.created_at === 'string' ? order.created_at : undefined,
                      )}
                    </td>
                    <td className="px-6 py-4 text-price-display text-on-surface">
                      {formatCurrency(typeof order.total === 'number' ? order.total : undefined)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/admin/orders" className="text-label-md font-bold text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
          <p className="text-label-md text-on-surface-variant">Total Orders</p>
          <p className="text-headline-lg text-on-surface">{stats?.total_orders ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
          <p className="text-label-md text-on-surface-variant">Active Buyers</p>
          <p className="text-headline-lg text-on-surface">{stats?.active_buyers ?? '—'}</p>
        </div>
        <Link
          to="/admin/orders"
          className="flex items-center rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 text-label-md font-bold text-primary hover:underline"
        >
          Manage Orders
        </Link>
        <Link
          to="/admin/users"
          className="flex items-center rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 text-label-md font-bold text-primary hover:underline"
        >
          Manage Users
        </Link>
      </div>

      {stats?.payouts ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-headline-lg text-on-surface">Payouts & settlements</h4>
              <p className="text-body-md text-on-surface-variant">
                Automated transfers to sellers and delivery agents.
              </p>
            </div>
            <Link to="/admin/payouts" className="text-label-md font-bold text-primary hover:underline">
              View all payouts
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 stitch-card-shadow">
              <p className="text-label-md text-on-surface-variant">Total paid out</p>
              <p className="text-headline-lg text-on-surface">{formatCurrency(stats.payouts.total_paid_out)}</p>
            </div>
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 stitch-card-shadow">
              <p className="text-label-md text-on-surface-variant">Pending payouts</p>
              <p className="text-headline-lg text-secondary">{formatCurrency(stats.payouts.pending_payouts)}</p>
            </div>
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 stitch-card-shadow">
              <p className="text-label-md text-on-surface-variant">Platform fees</p>
              <p className="text-headline-lg text-primary">{formatCurrency(stats.payouts.platform_fees_collected)}</p>
            </div>
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 stitch-card-shadow">
              <p className="text-label-md text-on-surface-variant">Unsettled</p>
              <p className="text-headline-lg text-on-surface">
                {formatCurrency(
                  stats.payouts.unsettled_upcoming.seller + stats.payouts.unsettled_upcoming.delivery_agent,
                )}
              </p>
            </div>
          </div>

          {stats.payouts.recent_payouts.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest stitch-card-shadow">
              <div className="border-b border-outline-variant/10 p-4">
                <h5 className="text-title-md font-bold text-on-surface">Recent payouts</h5>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {stats.payouts.recent_payouts.slice(0, 5).map((payout) => (
                  <div key={payout.uuid} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <p className="text-body-md font-medium text-on-surface">
                        {payout.payee?.name ?? 'Payee'} · {formatCurrency(payout.amount)}
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        {payout.payee_type === 'delivery_agent' ? 'Delivery agent' : 'Seller'}
                        {payout.payee?.store_name ? ` · ${payout.payee.store_name}` : ''}
                        {payout.reference ? ` · ${payout.reference}` : ''}
                      </p>
                    </div>
                    <span className="text-label-md capitalize text-on-surface-variant">{payout.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
