import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { deliveryService } from '@/api/services'
import { PayoutPanel } from '@/components/payout/PayoutPanel'
import { DeliveryPageShell } from '@/components/delivery/DeliveryPageShell'
import type { DeliveryDailyEarning } from '@/api/services/deliveryService'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type EarningsPeriod = 'week' | 'month' | 'all'

const PERIOD_OPTIONS: Array<{ id: EarningsPeriod; label: string }> = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'all', label: 'All' },
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
      <div className="flex h-56 items-end justify-between gap-2 px-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="flex flex-1 flex-col items-center">
            <div className="h-40 w-full max-w-[36px] animate-pulse rounded-t-xl bg-surface-container-high" />
            <span className="mt-3 text-xs text-on-surface-variant">{label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-56 items-end justify-between gap-2 px-2">
      {bars.map((bar) => {
        const heightPercent =
          maxEarnings === 0 || bar.earnings === 0
            ? 4
            : Math.max(10, Math.round((bar.earnings / maxEarnings) * 100))
        const isToday = bar.date === todayKey

        return (
          <div key={bar.date} className="group flex flex-1 flex-col items-center">
            <div className="relative w-full max-w-[36px] rounded-t-xl bg-primary/10">
              <div
                className={cn(
                  'absolute right-0 bottom-0 left-0 rounded-t-xl transition-all',
                  isToday ? 'bg-primary' : 'bg-primary/70 group-hover:bg-primary',
                )}
                style={{ height: `${heightPercent}%` }}
                title={`${bar.label}: ${formatCurrency(bar.earnings)}`}
              />
              <div className="h-40" />
            </div>
            <span
              className={cn(
                'mt-3 text-xs text-on-surface-variant',
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

function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string
  value: string
  hint?: string
  icon: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-[1.5rem] p-4 shadow-[0_4px_20px_-10px_rgba(15,40,20,0.14)]',
        accent
          ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary'
          : 'bg-surface',
      )}
    >
      <div className={cn('mb-2 flex items-center gap-2', accent ? 'text-on-primary/80' : 'text-on-surface-variant')}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        <span className="text-[11px] font-bold tracking-wide uppercase">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold tracking-tight', accent ? 'text-on-primary' : 'text-on-surface')}>
        {value}
      </p>
      {hint ? (
        <p className={cn('mt-1 text-sm', accent ? 'text-on-primary/80' : 'text-on-surface-variant')}>{hint}</p>
      ) : null}
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
    <DeliveryPageShell pathname="/delivery/earnings">
      <p className="text-sm leading-relaxed text-on-surface-variant">
        Delivery fees from completed orders.
      </p>

      <div className="flex gap-2 rounded-full bg-surface-container-high/80 p-1">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setPeriod(option.id)}
            className={cn(
              'flex-1 rounded-full px-3 py-2.5 text-sm font-bold transition-all',
              period === option.id
                ? 'bg-primary text-on-primary shadow-[0_6px_16px_-6px_rgba(13,99,27,0.5)]'
                : 'text-on-surface-variant',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-2xl bg-error-container/25 px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load earnings')}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          accent
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
          hint={`${earnings?.total_deliveries ?? 0} lifetime`}
          icon="account_balance_wallet"
        />
        <StatCard
          label="This month"
          value={isLoading ? '…' : formatCurrency(earnings?.month_earnings ?? 0)}
          icon="payments"
        />
      </div>

      {period === 'week' ? (
        <div className="rounded-[1.75rem] bg-surface p-4 shadow-[0_4px_20px_-10px_rgba(15,40,20,0.14)] sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-on-surface">Weekly rhythm</h3>
              <p className="text-sm text-on-surface-variant">Last 7 days</p>
            </div>
            {!isLoading && earnings ? (
              <p className="text-lg font-bold text-primary">
                {formatCurrency(earnings.week_earnings ?? 0)}
              </p>
            ) : null}
          </div>
          <WeeklyEarningsChart dailyEarnings={earnings?.daily_earnings} loading={isLoading} />
        </div>
      ) : null}

      <PayoutPanel api={deliveryPayoutApi} />
    </DeliveryPageShell>
  )
}
