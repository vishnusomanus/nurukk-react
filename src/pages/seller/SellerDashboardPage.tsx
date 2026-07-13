import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { DailySalesPoint, SellerOrder } from '@/api/services/sellerService'
import * as sellerService from '@/api/services/sellerService'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'
import { extractRows } from '@/utils/extractRows'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { sellerOrderLabel, sellerOrderStatusConfig } from '@/utils/sellerOrderStatus'
import { cn } from '@/utils/cn'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const softCard =
  'rounded-2xl bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:p-5 lg:shadow-none'

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
      <div className="flex h-40 items-end justify-between gap-1.5 px-1 lg:h-56 lg:gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="flex flex-1 flex-col items-center">
            <div className="h-28 w-full max-w-[36px] animate-pulse rounded-t-lg bg-surface-container-high lg:h-40" />
            <span className="mt-2 text-[10px] text-on-surface-variant lg:mt-3 lg:text-xs">{label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-40 items-end justify-between gap-1.5 px-1 lg:h-56 lg:gap-2">
      {bars.map((bar) => {
        const heightPercent =
          maxSales === 0 || bar.sales === 0
            ? 4
            : Math.max(10, Math.round((bar.sales / maxSales) * 100))
        const isToday = bar.date === todayKey

        return (
          <div key={bar.date} className="group flex flex-1 flex-col items-center">
            <div className="relative w-full max-w-[36px] rounded-t-lg bg-primary-container/20">
              <div
                className={cn(
                  'absolute right-0 bottom-0 left-0 rounded-t-lg transition-all',
                  isToday ? 'bg-primary' : 'bg-primary/70',
                )}
                style={{ height: `${heightPercent}%` }}
                title={`${bar.label}: ${formatCurrency(bar.sales)}`}
              />
              <div className="h-28 lg:h-40" />
            </div>
            <span
              className={cn(
                'mt-2 text-[10px] text-on-surface-variant lg:mt-3 lg:text-xs',
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

function hourGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function SellerDashboardPage() {
  const location = useLocation()
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
    <SellerPageShell pathname={location.pathname} className="space-y-3 lg:space-y-5">
      <section className={cn(softCard, 'flex items-start justify-between gap-3')}>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wide text-outline uppercase">{hourGreeting()}</p>
          <h2 className="mt-0.5 truncate text-xl font-bold text-on-surface lg:text-headline-xl">
            {greetingName(user?.name)}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">Here&apos;s your farm store today.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          Today
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl border border-error/20 bg-error-container px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load dashboard')}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className={softCard}>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">currency_rupee</span>
          </div>
          <p className="text-[10px] font-bold tracking-wide text-outline uppercase">Today&apos;s sales</p>
          <p className="mt-0.5 text-lg font-bold text-on-surface lg:text-xl">
            {isLoading ? '—' : formatCurrency(stats?.today_sales)}
          </p>
        </div>
        <div className={softCard}>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
          <p className="text-[10px] font-bold tracking-wide text-outline uppercase">Pending</p>
          <p className="mt-0.5 text-lg font-bold text-on-surface lg:text-xl">
            {isLoading ? '—' : (stats?.pending_orders ?? 0)}
          </p>
        </div>
        <Link to="/seller/products/new" className={cn(softCard, 'flex flex-col justify-center active:scale-[0.98]')}>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </div>
          <p className="text-sm font-bold text-primary">Add product</p>
        </Link>
        <Link to="/seller/orders" className={cn(softCard, 'flex flex-col justify-center active:scale-[0.98]')}>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          </div>
          <p className="text-sm font-bold text-on-surface">Orders</p>
        </Link>
      </div>

      <section className={softCard}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-bold text-on-surface lg:text-base">Weekly earnings</h3>
            <p className="text-xs text-on-surface-variant">Last 7 days</p>
          </div>
          <p className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-bold text-on-surface">
            {salesLoading ? '…' : formatCurrency(weekSales)}
          </p>
        </div>
        <WeeklyChart dailySales={dailySales} loading={salesLoading} />
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-on-surface lg:text-base">Recent orders</h3>
          <Link to="/seller/orders" className="text-sm font-bold text-primary">
            View all
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className={cn(softCard, 'py-10 text-center')}>
            <span className="material-symbols-outlined mb-2 text-4xl text-outline">receipt_long</span>
            <p className="text-sm text-on-surface-variant">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentOrders.map((order) => {
              const status = sellerOrderStatusConfig(order.status)
              return (
                <Link
                  key={order.uuid}
                  to={`/seller/orders/${order.uuid}`}
                  className={cn(softCard, 'flex items-center gap-3 py-3 active:bg-surface-container-low/50')}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-on-surface">
                      {sellerOrderLabel(order.order_number, order.uuid)}
                    </p>
                    <p className="text-xs text-on-surface-variant">{formatOrderDateTime(order.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-on-surface">{formatCurrency(order.total)}</p>
                    <span className={cn('mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', status.badgeClass)}>
                      {status.label}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-outline">chevron_right</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </SellerPageShell>
  )
}
