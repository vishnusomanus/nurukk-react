import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
import { PayoutPanel } from '@/components/payout/PayoutPanel'
import type { DeliveryDailyEarning } from '@/api/services/deliveryService'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type EarningsPeriod = 'week' | 'month' | 'all'

const PERIOD_OPTIONS: Array<{ id: EarningsPeriod; label: string }> = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
]

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function emptyWeek(): DeliveryDailyEarning[] {
  const today = new Date()
  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return {
      date: localDateKey(date),
      label,
      earnings: 0,
      deliveries: 0,
    }
  })
}

function WeeklyEarningsChart({
  dailyEarnings,
  loading,
}: {
  dailyEarnings?: DeliveryDailyEarning[]
  loading?: boolean
}) {
  const bars = dailyEarnings?.length ? dailyEarnings : emptyWeek()
  const maxEarnings = Math.max(...bars.map((bar) => bar.earnings), 0)
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
          maxEarnings === 0 || bar.earnings === 0
            ? 4
            : Math.max(10, Math.round((bar.earnings / maxEarnings) * 100))
        const isToday = bar.date === todayKey

        return (
          <div key={bar.date} className="group flex flex-1 flex-col items-center">
            <div className="relative w-full max-w-[40px] rounded-t-lg bg-secondary/10 transition-colors group-hover:bg-secondary/20">
              <div
                className={cn(
                  'absolute right-0 bottom-0 left-0 rounded-t-lg transition-all',
                  isToday ? 'bg-secondary' : 'bg-secondary/70 group-hover:bg-secondary',
                )}
                style={{ height: `${heightPercent}%` }}
                title={`${bar.label}: ${formatCurrency(bar.earnings)}${bar.deliveries ? ` (${bar.deliveries} deliveries)` : ''}`}
              />
              <div className="h-48" />
            </div>
            <span
              className={cn(
                'mt-4 text-label-md text-on-surface-variant',
                isToday && 'font-bold text-secondary',
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

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon: string
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5 stitch-card-shadow">
      <div className="mb-3 flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px] text-secondary">{icon}</span>
        <span className="text-label-md uppercase">{label}</span>
      </div>
      <p className="text-headline-xl text-on-surface">{value}</p>
      {hint ? <p className="text-body-md mt-1 text-on-surface-variant">{hint}</p> : null}
    </div>
  )
}

const deliveryPayoutApi = {
  getSummary: deliveryService.getPayoutSummary,
  listPayouts: deliveryService.listPayouts,
  getPayout: deliveryService.getPayout,
  getAccount: deliveryService.getPayoutAccount,
  saveAccount: deliveryService.savePayoutAccount,
  queryKeyPrefix: 'delivery',
  scheduleLabel: 'Next business day after each completed delivery (processed daily at 6:00 AM).',
  nextPayoutAtKey: 'next_delivery_payout_at' as const,
}

export function DeliveryEarningsPage() {
  const [period, setPeriod] = useState<EarningsPeriod>('week')

  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery', 'earnings', period],
    queryFn: () => deliveryService.getEarnings(period),
  })

  const earnings = data?.data
  const periodLabel =
    period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'All time'

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-2">
        <h2 className="text-headline-xl text-on-surface">Earnings</h2>
        <p className="text-body-md text-on-surface-variant">
          Delivery fees earned from completed orders.
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/40 bg-surface p-1.5 stitch-card-shadow">
        <div className="grid grid-cols-3 gap-1.5">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPeriod(option.id)}
              className={cn(
                'rounded-xl px-3 py-2.5 text-label-md font-bold transition-all',
                period === option.id
                  ? 'bg-secondary text-on-secondary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load earnings')}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={periodLabel}
          value={isLoading ? '…' : formatCurrency(earnings?.period_earnings ?? 0)}
          hint={`${earnings?.period_deliveries ?? 0} deliveries`}
          icon="calendar_month"
        />
        <StatCard
          label="Today"
          value={isLoading ? '…' : formatCurrency(earnings?.today_earnings ?? 0)}
          icon="today"
        />
        <StatCard
          label="Total earned"
          value={isLoading ? '…' : formatCurrency(earnings?.total_earnings ?? 0)}
          hint={`${earnings?.total_deliveries ?? 0} lifetime deliveries`}
          icon="account_balance_wallet"
        />
        <StatCard
          label="This month"
          value={isLoading ? '…' : formatCurrency(earnings?.month_earnings ?? 0)}
          icon="payments"
        />
      </div>

      {period === 'week' ? (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-4 stitch-card-shadow lg:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-headline-lg text-on-surface">Weekly breakdown</h3>
              <p className="text-body-md text-on-surface-variant">Daily delivery fees for the last 7 days</p>
            </div>
            {!isLoading && earnings ? (
              <p className="text-headline-lg font-bold text-secondary">
                {formatCurrency(earnings.week_earnings ?? 0)}
              </p>
            ) : null}
          </div>
          <WeeklyEarningsChart dailyEarnings={earnings?.daily_earnings} loading={isLoading} />
        </div>
      ) : null}

      <PayoutPanel api={deliveryPayoutApi} />
    </div>
  )
}
