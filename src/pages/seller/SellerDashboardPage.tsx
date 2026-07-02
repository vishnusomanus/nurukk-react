import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { DailySalesPoint, SellerOrder } from '@/api/services/sellerService'
import * as sellerService from '@/api/services/sellerService'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'
import { extractRows } from '@/utils/extractRows'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { sellerOrderLabel, sellerOrderStatusConfig } from '@/utils/sellerOrderStatus'
import { cn } from '@/utils/cn'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function emptyWeek(): DailySalesPoint[] {
  const today = new Date()
  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return {
      date: localDateKey(date),
      label,
      sales: 0,
      orders: 0,
    }
  })
}

function WeeklyChart({ dailySales, loading }: { dailySales?: DailySalesPoint[]; loading?: boolean }) {
  const bars = dailySales?.length ? dailySales : emptyWeek()
  const maxSales = Math.max(...bars.map((bar) => bar.sales), 0)
  const todayKey = localDateKey(new Date())

  if (loading) {
    return (
      <div className="flex h-64 items-end justify-between gap-2 px-4">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="flex flex-1 flex-col items-center">
            <div className="h-48 w-full max-w-[40px] animate-pulse rounded-t-lg bg-surface-container-high" />
            <span className="mt-4 text-label-md text-on-surface-variant">{label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-64 items-end justify-between gap-2 px-4">
      {bars.map((bar) => {
        const heightPercent =
          maxSales === 0 || bar.sales === 0
            ? 4
            : Math.max(10, Math.round((bar.sales / maxSales) * 100))
        const isToday = bar.date === todayKey

        return (
          <div key={bar.date} className="group flex flex-1 flex-col items-center">
            <div className="relative w-full max-w-[40px] rounded-t-lg bg-primary-container/20 transition-colors group-hover:bg-primary-container/30">
              <div
                className={cn(
                  'absolute right-0 bottom-0 left-0 rounded-t-lg transition-all',
                  isToday ? 'bg-primary' : 'bg-primary/70 group-hover:bg-primary',
                )}
                style={{ height: `${heightPercent}%` }}
                title={`${bar.label}: ${formatCurrency(bar.sales)}${bar.orders ? ` (${bar.orders} orders)` : ''}`}
              />
              <div className="h-48" />
            </div>
            <span
              className={cn(
                'mt-4 text-label-md text-on-surface-variant',
                isToday && 'font-bold text-primary',
              )}
            >
              {bar.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function greetingName(name?: string | null): string {
  if (!name) return 'there'
  return name.split(' ')[0] ?? name
}

export function SellerDashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'dashboard'],
    queryFn: () => sellerService.getDashboard(),
  })

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['seller', 'reports', 'week'],
    queryFn: () => sellerService.getSalesReport('week'),
  })

  const { data: recentOrdersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['seller', 'orders', 'recent'],
    queryFn: () => sellerService.listOrders({ page: 1, per_page: 5 }),
  })

  const stats = data?.data
  const weekSales = salesData?.data?.total_sales ?? 0
  const dailySales = salesData?.data?.daily_sales
  const recentOrders = extractRows(recentOrdersData?.data) as SellerOrder[]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-xl text-on-surface">
            Good Morning, {greetingName(user?.name)}!
          </h2>
          <p className="text-body-lg text-on-surface-variant">Here&apos;s what&apos;s happening with your farm today.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-primary-container/10 px-4 py-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            calendar_today
          </span>
          <span className="text-label-md text-primary">{formatOrderDateTime(new Date().toISOString())}</span>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load dashboard')}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="stitch-hover-lift cursor-pointer rounded-xl border border-surface-variant bg-surface-container-lowest p-6 stitch-card-shadow">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-primary-container/20 p-2">
                <span className="material-symbols-outlined text-primary">currency_rupee</span>
              </div>
              <span className="flex items-center gap-1 text-label-md font-bold text-primary">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                Today
              </span>
            </div>
            <p className="text-label-md tracking-wider text-on-surface-variant uppercase">Today&apos;s Sales</p>
            <h3 className="mt-1 text-headline-xl text-on-surface">
              {isLoading ? '—' : formatCurrency(stats?.today_sales)}
            </h3>
          </div>

          <div className="stitch-hover-lift cursor-pointer rounded-xl border border-surface-variant bg-surface-container-lowest p-6 stitch-card-shadow">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-secondary-container/20 p-2">
                <span className="material-symbols-outlined text-secondary">pending_actions</span>
              </div>
              {(stats?.pending_orders ?? 0) > 0 ? (
                <span className="text-label-md font-bold text-secondary">Urgent</span>
              ) : null}
            </div>
            <p className="text-label-md tracking-wider text-on-surface-variant uppercase">Pending Orders</p>
            <h3 className="mt-1 text-headline-xl text-on-surface">
              {isLoading ? '—' : (stats?.pending_orders ?? 0)}
            </h3>
          </div>
        </div>

        <div className="rounded-xl border border-surface-variant bg-surface-container-lowest p-6 stitch-card-shadow lg:col-span-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-headline-lg text-on-surface">Weekly Earnings</h4>
              <p className="text-body-md text-on-surface-variant">Revenue performance for the last 7 days</p>
            </div>
            <div className="rounded-lg bg-surface-container-low px-3 py-2 text-label-md text-on-surface-variant">
              {salesLoading ? '…' : `${formatCurrency(weekSales)} total`}
            </div>
          </div>
          <WeeklyChart dailySales={dailySales} loading={salesLoading} />
        </div>
      </div>

      <div>
        <h4 className="mb-6 text-headline-lg text-on-surface">Quick Actions</h4>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link
            to="/seller/products/new"
            className="group flex flex-col items-center justify-center rounded-xl bg-primary-container p-8 text-on-primary-container shadow-lg transition-all hover:brightness-110 active:scale-95"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-on-primary-container/20 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-[32px]">add_circle</span>
            </div>
            <span className="text-headline-lg">Add Product</span>
            <p className="mt-1 text-body-md text-on-primary-container/80">List new farm items</p>
          </Link>

          <Link
            to="/seller/products"
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-primary-container/20 bg-surface-container-lowest p-8 text-primary stitch-card-shadow transition-all hover:bg-primary-container/5 active:scale-95"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/10 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-[32px]">inventory_2</span>
            </div>
            <span className="text-headline-lg">View Inventory</span>
            <p className="mt-1 text-body-md text-on-surface-variant">Stock levels &amp; pricing</p>
          </Link>

          <Link
            to="/seller/orders"
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-primary-container/20 bg-surface-container-lowest p-8 text-primary stitch-card-shadow transition-all hover:bg-primary-container/5 active:scale-95"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/10 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-[32px]">local_shipping</span>
            </div>
            <span className="text-headline-lg">Manage Orders</span>
            <p className="mt-1 text-body-md text-on-surface-variant">Active &amp; past deliveries</p>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest stitch-card-shadow">
        <div className="flex items-center justify-between border-b border-surface-variant px-6 py-6">
          <h4 className="text-headline-lg text-on-surface">Recent Orders</h4>
          <Link to="/seller/orders" className="text-label-md font-bold text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low">
                {['Order ID', 'Amount', 'Status', 'Date', ''].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-label-md tracking-wider text-on-surface-variant uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {ordersLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-body-md text-on-surface-variant">
                    Loading recent orders...
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-body-md text-on-surface-variant">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const status = sellerOrderStatusConfig(order.status)
                  return (
                    <tr key={order.uuid} className="transition-colors hover:bg-surface-container-low/50">
                      <td className="px-6 py-4 text-body-md font-bold text-primary">
                        {sellerOrderLabel(order.order_number, order.uuid)}
                      </td>
                      <td className="px-6 py-4 text-price-display text-on-surface">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4">
                        <span className={cn('rounded-full px-2 py-1 text-[10px] uppercase', status.badgeClass)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-body-md text-on-surface-variant">
                        {formatOrderDateTime(order.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/seller/orders/${order.uuid}`}
                          className="text-label-md font-bold text-primary hover:underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
