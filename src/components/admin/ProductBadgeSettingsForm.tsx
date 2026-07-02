import type { ProductBadgeSettings } from '@/api/services/adminProductBadgeService'
import { AdminSettingsField, AdminSettingsToggle } from '@/components/admin/AdminSettingsField'
import { cn } from '@/utils/cn'

type BadgeRuleKey = keyof ProductBadgeSettings

type BadgeFieldConfig = {
  name: string
  label: string
  hint?: string
  min?: number
  max?: number
  step?: number
}

type BadgeRuleConfig = {
  key: BadgeRuleKey
  icon: string
  title: string
  description: string
  previewLabel: string
  previewClass: string
  fields: BadgeFieldConfig[]
}

const BADGE_RULES: BadgeRuleConfig[] = [
  {
    key: 'best_seller',
    icon: 'local_fire_department',
    title: 'Best Seller',
    description: 'Highlights products with strong sales volume across delivered orders.',
    previewLabel: 'Best Seller',
    previewClass: 'bg-secondary-container/20 text-on-secondary-container border-secondary-container/30',
    fields: [
      { name: 'min_units_sold', label: 'Minimum units sold', hint: 'Total units sold on delivered orders.', min: 0 },
      { name: 'min_order_count', label: 'Minimum delivered orders', hint: 'Orders that must reach delivered status.', min: 0 },
    ],
  },
  {
    key: 'premium',
    icon: 'diamond',
    title: 'Premium',
    description: 'Recognizes sellers with excellent fulfillment and buyer ratings.',
    previewLabel: 'Premium',
    previewClass: 'bg-tertiary-fixed/30 text-on-tertiary-fixed border-tertiary-fixed/40',
    fields: [
      { name: 'min_delivered_orders', label: 'Minimum delivered orders', min: 0 },
      { name: 'min_fulfillment_rate', label: 'Minimum fulfillment rate (%)', hint: 'Share of orders fulfilled on time.', min: 0, max: 100, step: 0.1 },
      { name: 'min_avg_rating', label: 'Minimum average rating', min: 0, max: 5, step: 0.1 },
      { name: 'min_rating_count', label: 'Minimum rating count', min: 0 },
    ],
  },
  {
    key: 'top_seller',
    icon: 'emoji_events',
    title: 'Top Seller',
    description: 'For high-volume sellers with consistently strong fulfillment.',
    previewLabel: 'Top Seller',
    previewClass: 'bg-primary-container/20 text-primary border-primary-container/30',
    fields: [
      { name: 'min_delivered_orders', label: 'Minimum delivered orders', min: 0 },
      { name: 'min_fulfillment_rate', label: 'Minimum fulfillment rate (%)', min: 0, max: 100, step: 0.1 },
    ],
  },
  {
    key: 'trusted',
    icon: 'verified',
    title: 'Trusted',
    description: 'Shows when a seller earns strong, consistent buyer ratings.',
    previewLabel: 'Trusted',
    previewClass: 'bg-primary-fixed/30 text-on-primary-fixed border-primary-fixed/40',
    fields: [
      { name: 'min_rating_count', label: 'Minimum rating count', min: 0 },
      { name: 'min_avg_rating', label: 'Minimum average rating', min: 0, max: 5, step: 0.1 },
    ],
  },
  {
    key: 'new_seller',
    icon: 'spa',
    title: 'New Seller',
    description: 'Welcomes recently joined sellers with a limited delivery history.',
    previewLabel: 'New Seller',
    previewClass: 'bg-surface-container-high text-on-surface-variant border-outline-variant/40',
    fields: [
      { name: 'max_account_age_days', label: 'Maximum account age (days)', hint: 'Seller account must be newer than this.', min: 1 },
      { name: 'max_delivered_orders', label: 'Maximum delivered orders', hint: 'Seller must stay below this delivery count.', min: 0 },
    ],
  },
]

type ProductBadgeSettingsFormProps = {
  value: ProductBadgeSettings
  onChange: (next: ProductBadgeSettings) => void
}

function BadgeRuleCard({
  config,
  rule,
  onEnabledChange,
  onFieldChange,
}: {
  config: BadgeRuleConfig
  rule: ProductBadgeSettings[BadgeRuleKey]
  onEnabledChange: (enabled: boolean) => void
  onFieldChange: (field: string, value: string) => void
}) {
  const enabled = rule.enabled

  return (
    <article className="stitch-card-shadow overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
      <div className="border-b border-outline-variant/30 bg-surface-container-low/50 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {config.icon}
              </span>
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-headline-lg text-on-surface">{config.title}</h3>
                <span
                  className={cn(
                    'text-label-md rounded-full border px-3 py-0.5 font-bold uppercase tracking-wide',
                    config.previewClass,
                  )}
                >
                  {config.previewLabel}
                </span>
              </div>
              <p className="text-body-md max-w-2xl text-on-surface-variant">{config.description}</p>
            </div>
          </div>
          <AdminSettingsToggle label="Show this badge" checked={enabled} onChange={onEnabledChange} className="sm:min-w-[220px]" />
        </div>
      </div>

      <div className={cn('grid gap-4 px-6 py-5 sm:grid-cols-2', !enabled && 'pointer-events-none opacity-50')}>
        {config.fields.map((field) => {
          const fieldValue = rule[field.name as keyof typeof rule]
          return (
            <AdminSettingsField
              key={field.name}
              label={field.label}
              hint={field.hint}
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              disabled={!enabled}
              value={Number(fieldValue ?? 0)}
              onChange={(e) => onFieldChange(field.name, e.target.value)}
            />
          )
        })}
      </div>
    </article>
  )
}

export function ProductBadgeSettingsForm({ value, onChange }: ProductBadgeSettingsFormProps) {
  const updateRule = (ruleKey: BadgeRuleKey, field: string, fieldValue: string | boolean) => {
    const numeric = typeof fieldValue === 'string' ? Number(fieldValue) : fieldValue
    onChange({
      ...value,
      [ruleKey]: {
        ...value[ruleKey],
        [field]: typeof fieldValue === 'boolean' ? fieldValue : numeric,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="stitch-card-shadow rounded-xl border border-primary/20 bg-primary-container/5 p-4">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-primary">info</span>
          <p className="text-body-md text-on-surface-variant">
            These rules control the labels shown on product cards in the buyer marketplace. Toggle a badge off
            to hide it completely, then adjust the thresholds for when it appears.
          </p>
        </div>
      </div>

      {BADGE_RULES.map((config) => (
        <BadgeRuleCard
          key={config.key}
          config={config}
          rule={value[config.key]}
          onEnabledChange={(enabled) => updateRule(config.key, 'enabled', enabled)}
          onFieldChange={(field, fieldValue) => updateRule(config.key, field, fieldValue)}
        />
      ))}
    </div>
  )
}

export function getDefaultProductBadgeSettings(): ProductBadgeSettings {
  return {
    best_seller: { enabled: true, min_units_sold: 10, min_order_count: 3 },
    premium: {
      enabled: true,
      min_delivered_orders: 15,
      min_fulfillment_rate: 90,
      min_avg_rating: 4,
      min_rating_count: 3,
    },
    top_seller: { enabled: true, min_delivered_orders: 30, min_fulfillment_rate: 95 },
    trusted: { enabled: true, min_rating_count: 5, min_avg_rating: 4.5 },
    new_seller: { enabled: true, max_account_age_days: 30, max_delivered_orders: 4 },
  }
}
