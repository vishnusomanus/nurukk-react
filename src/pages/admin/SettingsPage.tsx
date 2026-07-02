import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { adminProductBadgeService, settingsService } from '@/api/services'
import type { ProductBadgeSettings } from '@/api/services/adminProductBadgeService'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

function formatSettingValue(value: unknown) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function BadgeRuleCard({
  title,
  description,
  enabled,
  onEnabledChange,
  children,
}: {
  title: string
  description: string
  enabled: boolean
  onEnabledChange: (value: boolean) => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-xs text-zinc-600 dark:text-white/60">{description}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-zinc-700 dark:text-white/80">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          Enabled
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [badgeForm, setBadgeForm] = useState<ProductBadgeSettings | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.listSettings(),
  })

  const badgeQuery = useQuery({
    queryKey: ['admin', 'product-badges'],
    queryFn: () => adminProductBadgeService.getProductBadgeSettings(),
  })

  useEffect(() => {
    if (badgeQuery.data?.data) {
      setBadgeForm(badgeQuery.data.data)
    }
  }, [badgeQuery.data?.data])

  const saveBadges = useMutation({
    mutationFn: (payload: ProductBadgeSettings) =>
      adminProductBadgeService.updateProductBadgeSettings(payload),
    onSuccess: () => {
      setSaveMessage('Product badge settings saved.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'product-badges'] })
    },
  })

  const settingsRecord =
    settingsQuery.data?.data && typeof settingsQuery.data.data === 'object'
      ? (settingsQuery.data.data as Record<string, unknown>)
      : {}

  const generalSettings = Object.entries(settingsRecord).filter(
    ([key]) => key !== 'product_badge_settings',
  )

  const updateBadgeField = (
    rule: keyof ProductBadgeSettings,
    field: string,
    value: string | boolean,
  ) => {
    setBadgeForm((current) => {
      if (!current) return current
      const numeric = typeof value === 'string' ? Number(value) : value
      return {
        ...current,
        [rule]: {
          ...current[rule],
          [field]: typeof value === 'boolean' ? value : numeric,
        },
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Product Badge Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-white/70">
            Configure the seller-activity thresholds used for Premium, Best Seller, Top Seller,
            Trusted, and New Seller labels on buyer product cards.
          </p>

          {badgeQuery.error ? (
            <div className="text-sm text-amber-700 dark:text-amber-200">
              {getApiErrorMessage(badgeQuery.error, 'Failed to load badge settings')}
            </div>
          ) : null}

          {badgeQuery.isLoading || !badgeForm ? (
            <div className="text-sm text-zinc-600 dark:text-white/70">Loading badge settings…</div>
          ) : (
            <div className="space-y-4">
              <BadgeRuleCard
                title="Best Seller"
                description="Based on delivered product sales volume."
                enabled={badgeForm.best_seller.enabled}
                onEnabledChange={(value) => updateBadgeField('best_seller', 'enabled', value)}
              >
                <Input
                  label="Minimum units sold"
                  type="number"
                  min={0}
                  value={badgeForm.best_seller.min_units_sold ?? 0}
                  onChange={(e) => updateBadgeField('best_seller', 'min_units_sold', e.target.value)}
                />
                <Input
                  label="Minimum delivered orders"
                  type="number"
                  min={0}
                  value={badgeForm.best_seller.min_order_count ?? 0}
                  onChange={(e) => updateBadgeField('best_seller', 'min_order_count', e.target.value)}
                />
              </BadgeRuleCard>

              <BadgeRuleCard
                title="Premium"
                description="Seller with strong delivery performance and ratings."
                enabled={badgeForm.premium.enabled}
                onEnabledChange={(value) => updateBadgeField('premium', 'enabled', value)}
              >
                <Input
                  label="Minimum delivered orders"
                  type="number"
                  min={0}
                  value={badgeForm.premium.min_delivered_orders ?? 0}
                  onChange={(e) => updateBadgeField('premium', 'min_delivered_orders', e.target.value)}
                />
                <Input
                  label="Minimum fulfillment rate (%)"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={badgeForm.premium.min_fulfillment_rate ?? 0}
                  onChange={(e) => updateBadgeField('premium', 'min_fulfillment_rate', e.target.value)}
                />
                <Input
                  label="Minimum average rating"
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={badgeForm.premium.min_avg_rating ?? 0}
                  onChange={(e) => updateBadgeField('premium', 'min_avg_rating', e.target.value)}
                />
                <Input
                  label="Minimum rating count"
                  type="number"
                  min={0}
                  value={badgeForm.premium.min_rating_count ?? 0}
                  onChange={(e) => updateBadgeField('premium', 'min_rating_count', e.target.value)}
                />
              </BadgeRuleCard>

              <BadgeRuleCard
                title="Top Seller"
                description="High-volume sellers with excellent fulfillment."
                enabled={badgeForm.top_seller.enabled}
                onEnabledChange={(value) => updateBadgeField('top_seller', 'enabled', value)}
              >
                <Input
                  label="Minimum delivered orders"
                  type="number"
                  min={0}
                  value={badgeForm.top_seller.min_delivered_orders ?? 0}
                  onChange={(e) => updateBadgeField('top_seller', 'min_delivered_orders', e.target.value)}
                />
                <Input
                  label="Minimum fulfillment rate (%)"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={badgeForm.top_seller.min_fulfillment_rate ?? 0}
                  onChange={(e) =>
                    updateBadgeField('top_seller', 'min_fulfillment_rate', e.target.value)
                  }
                />
              </BadgeRuleCard>

              <BadgeRuleCard
                title="Trusted"
                description="Seller with consistently high buyer ratings."
                enabled={badgeForm.trusted.enabled}
                onEnabledChange={(value) => updateBadgeField('trusted', 'enabled', value)}
              >
                <Input
                  label="Minimum rating count"
                  type="number"
                  min={0}
                  value={badgeForm.trusted.min_rating_count ?? 0}
                  onChange={(e) => updateBadgeField('trusted', 'min_rating_count', e.target.value)}
                />
                <Input
                  label="Minimum average rating"
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={badgeForm.trusted.min_avg_rating ?? 0}
                  onChange={(e) => updateBadgeField('trusted', 'min_avg_rating', e.target.value)}
                />
              </BadgeRuleCard>

              <BadgeRuleCard
                title="New Seller"
                description="Recently joined sellers with limited delivery history."
                enabled={badgeForm.new_seller.enabled}
                onEnabledChange={(value) => updateBadgeField('new_seller', 'enabled', value)}
              >
                <Input
                  label="Maximum account age (days)"
                  type="number"
                  min={1}
                  value={badgeForm.new_seller.max_account_age_days ?? 0}
                  onChange={(e) =>
                    updateBadgeField('new_seller', 'max_account_age_days', e.target.value)
                  }
                />
                <Input
                  label="Maximum delivered orders"
                  type="number"
                  min={0}
                  value={badgeForm.new_seller.max_delivered_orders ?? 0}
                  onChange={(e) =>
                    updateBadgeField('new_seller', 'max_delivered_orders', e.target.value)
                  }
                />
              </BadgeRuleCard>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  disabled={saveBadges.isPending}
                  onClick={() => badgeForm && saveBadges.mutate(badgeForm)}
                >
                  {saveBadges.isPending ? 'Saving…' : 'Save badge settings'}
                </Button>
                {saveMessage ? (
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">{saveMessage}</span>
                ) : null}
                {saveBadges.error ? (
                  <span className="text-sm text-amber-700 dark:text-amber-200">
                    {getApiErrorMessage(saveBadges.error, 'Failed to save badge settings')}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {settingsQuery.isLoading ? (
            <div className="text-sm text-zinc-600 dark:text-white/70">Loading settings…</div>
          ) : settingsQuery.error ? (
            <div className="text-sm text-amber-700 dark:text-amber-200">
              {getApiErrorMessage(settingsQuery.error, 'Failed to load settings')}
            </div>
          ) : generalSettings.length === 0 ? (
            <div className="text-sm text-zinc-600 dark:text-white/70">No settings configured.</div>
          ) : (
            <div className="space-y-2">
              {generalSettings.map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col gap-1 rounded-lg border border-black/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"
                >
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">{key}</div>
                  <div className="text-sm text-zinc-600 dark:text-white/70">
                    {formatSettingValue(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
