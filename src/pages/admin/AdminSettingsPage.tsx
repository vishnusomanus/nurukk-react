import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminProductBadgeService, adminDeliveryService, settingsService } from '@/api/services'
import { APP_NAME } from '@/constants/app'
import type { DeliveryZone } from '@/api/services/adminDeliveryService'
import type { ProductBadgeSettings } from '@/api/services/adminProductBadgeService'
import {
  AdminSettingsField,
  AdminSettingsSelect,
  AdminSettingsToggle,
} from '@/components/admin/AdminSettingsField'
import { ProductBadgeSettingsForm } from '@/components/admin/ProductBadgeSettingsForm'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type SettingFieldType = 'text' | 'email' | 'password' | 'number' | 'boolean' | 'select'

const BADGE_SETTING_KEY = 'product_badge_settings'

const GLOBAL_SETTING_DEFAULTS: Record<string, unknown> = {
  site_name: 'nurukk',
  site_email: '',
  payment_gateway: 'razorpay',
  cod_enabled: true,
  payment_gateway_key: '',
  admin_secret_key: '',
  platform_fee_enabled: false,
  platform_fee_amount: 0,
  platform_fee_percent: 0,
  delivery_charge: 40,
  delivery_per_km_rate: 8,
  max_delivery_radius_km: 15,
  delivery_module_enabled: false,
  rain_mode_enabled: false,
  rain_surcharge_percent: 20,
}

const GLOBAL_SETTING_ORDER = [
  'site_name',
  'site_email',
  'payment_gateway',
  'cod_enabled',
  'payment_gateway_key',
  'platform_fee_enabled',
  'platform_fee_amount',
  'platform_fee_percent',
  'delivery_charge',
  'delivery_per_km_rate',
  'max_delivery_radius_km',
  'delivery_module_enabled',
  'rain_mode_enabled',
  'rain_surcharge_percent',
  'admin_secret_key',
]

const GLOBAL_SETTING_LABELS: Record<string, string> = {
  site_name: 'Site name',
  site_email: 'Support email',
  payment_gateway: 'Payment gateway',
  cod_enabled: 'Cash on Delivery enabled',
  payment_gateway_key: 'Payment gateway key',
  platform_fee_enabled: 'Platform fee enabled',
  platform_fee_amount: 'Platform fee fixed amount (₹)',
  platform_fee_percent: 'Platform fee percentage (%)',
  delivery_charge: 'Base delivery charge (₹)',
  delivery_per_km_rate: 'Delivery rate per km (₹)',
  max_delivery_radius_km: 'Max delivery radius (km)',
  delivery_module_enabled: 'Delivery module enabled',
  rain_mode_enabled: 'Rain mode enabled',
  rain_surcharge_percent: 'Rain surcharge (%)',
  admin_secret_key: 'Admin secret key',
}

const GLOBAL_SETTING_HINTS: Record<string, string> = {
  payment_gateway: 'Active gateway for checkout payments.',
  cod_enabled: 'When disabled, buyers can only pay online at checkout.',
  platform_fee_enabled: 'Adds a nurukk service fee to every order at checkout.',
  platform_fee_amount: 'Flat fee added to each order when platform fee is enabled.',
  platform_fee_percent: 'Percentage of item subtotal added on top of the fixed fee.',
  delivery_module_enabled: 'Enables platform delivery agents and related OTP roles.',
  max_delivery_radius_km: 'Orders are blocked when the buyer is farther than this distance from the store.',
  rain_mode_enabled: 'Applies rain surcharge to delivery pricing when enabled.',
}

const GLOBAL_SETTING_SELECT: Record<string, string[]> = {
  payment_gateway: ['razorpay', 'cashfree'],
}

const GLOBAL_SETTING_TYPES: Record<string, SettingFieldType> = {
  site_name: 'text',
  site_email: 'email',
  payment_gateway: 'select',
  cod_enabled: 'boolean',
  payment_gateway_key: 'password',
  admin_secret_key: 'password',
  platform_fee_enabled: 'boolean',
  platform_fee_amount: 'number',
  platform_fee_percent: 'number',
  delivery_charge: 'number',
  delivery_per_km_rate: 'number',
  max_delivery_radius_km: 'number',
  delivery_module_enabled: 'boolean',
  rain_mode_enabled: 'boolean',
  rain_surcharge_percent: 'number',
}

const SECRET_SETTING_KEYS = new Set(['admin_secret_key', 'payment_gateway_key'])

function sortGlobalSettingKeys(keys: string[]): string[] {
  const orderIndex = new Map(GLOBAL_SETTING_ORDER.map((key, index) => [key, index]))
  return [...keys].sort((a, b) => {
    const aIndex = orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER
    const bIndex = orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER
    if (aIndex !== bIndex) return aIndex - bIndex
    return a.localeCompare(b)
  })
}

function inferSettingType(key: string, value: unknown): SettingFieldType {
  if (GLOBAL_SETTING_TYPES[key]) return GLOBAL_SETTING_TYPES[key]!
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (key.includes('email')) return 'email'
  if (SECRET_SETTING_KEYS.has(key)) return 'password'
  return 'text'
}

function normalizeSettingValue(key: string, value: unknown): unknown {
  const type = inferSettingType(key, value)
  if (value !== null && value !== undefined) return value
  if (type === 'boolean') return false
  if (type === 'number') return 0
  if (type === 'select') return GLOBAL_SETTING_SELECT[key]?.[0] ?? ''
  return GLOBAL_SETTING_DEFAULTS[key] ?? ''
}

function buildGlobalForm(record: Record<string, unknown>): Record<string, unknown> {
  const keys = new Set([
    ...Object.keys(GLOBAL_SETTING_DEFAULTS),
    ...Object.keys(record).filter((key) => key !== BADGE_SETTING_KEY),
  ])

  const form: Record<string, unknown> = {}
  for (const key of keys) {
    const raw = record[key] ?? GLOBAL_SETTING_DEFAULTS[key]
    form[key] = normalizeSettingValue(key, raw)
  }
  return form
}

function GlobalSettingField({
  settingKey,
  value,
  onChange,
}: {
  settingKey: string
  value: unknown
  onChange: (value: unknown) => void
}) {
  const label = GLOBAL_SETTING_LABELS[settingKey] ?? settingKey.replace(/_/g, ' ')
  const hint = GLOBAL_SETTING_HINTS[settingKey]
  const type = inferSettingType(settingKey, value)
  const selectOptions = GLOBAL_SETTING_SELECT[settingKey]

  if (type === 'select' && selectOptions) {
    return (
      <AdminSettingsSelect
        label={label}
        hint={hint}
        options={selectOptions}
        value={String(value ?? selectOptions[0])}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  if (type === 'boolean') {
    return (
      <AdminSettingsToggle
        label={label}
        hint={hint}
        checked={Boolean(value)}
        onChange={onChange}
      />
    )
  }

  if (type === 'number') {
    return (
      <AdminSettingsField
        label={label}
        hint={hint}
        type="number"
        value={Number(value ?? 0)}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    )
  }

  return (
    <AdminSettingsField
      label={label}
      hint={hint}
      type={type === 'email' ? 'email' : type === 'password' ? 'password' : 'text'}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function SettingsBentoCard({
  icon,
  title,
  description,
  className,
  children,
}: {
  icon: string
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'group flex flex-col justify-between rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 stitch-card-shadow transition-all hover:border-primary/30',
        className,
      )}
    >
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <h5 className="mb-2 text-lg font-bold text-on-surface">{title}</h5>
        <p className="text-body-md text-on-surface-variant">{description}</p>
      </div>
      {children}
    </div>
  )
}

export function AdminSettingsPage() {
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [badgeForm, setBadgeForm] = useState<ProductBadgeSettings | null>(null)
  const [globalForm, setGlobalForm] = useState<Record<string, unknown>>(() => buildGlobalForm({}))
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [zonePincode, setZonePincode] = useState('')
  const [zoneCity, setZoneCity] = useState('')
  const [zoneCharge, setZoneCharge] = useState('40')

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.listSettings(),
  })

  const badgeQuery = useQuery({
    queryKey: ['admin', 'product-badges'],
    queryFn: () => adminProductBadgeService.getProductBadgeSettings(),
  })

  const deliveryQuery = useQuery({
    queryKey: ['admin', 'delivery'],
    queryFn: () => adminDeliveryService.getDeliverySettings(),
  })

  const createZone = useMutation({
    mutationFn: () =>
      adminDeliveryService.createZone({
        pincode: zonePincode.trim(),
        city: zoneCity.trim() || undefined,
        delivery_charge: Number(zoneCharge) || undefined,
        is_serviceable: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery'] })
      setZonePincode('')
      setZoneCity('')
    },
  })

  const deleteZone = useMutation({
    mutationFn: (id: number) => adminDeliveryService.deleteZone(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'delivery'] }),
  })

  const deliveryZones = (deliveryQuery.data?.data?.zones ?? []) as DeliveryZone[]

  useEffect(() => {
    if (badgeQuery.data?.data) {
      setBadgeForm(badgeQuery.data.data)
    }
  }, [badgeQuery.data?.data])

  useEffect(() => {
    if (settingsQuery.data?.data && typeof settingsQuery.data.data === 'object') {
      const record = settingsQuery.data.data as Record<string, unknown>
      setGlobalForm(buildGlobalForm(record))
    }
  }, [settingsQuery.data?.data])

  const saveAllSettings = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const settingsPayload = { ...payload }
      if (badgeForm) {
        settingsPayload[BADGE_SETTING_KEY] = badgeForm
      }

      await settingsService.updateSettings({
        settings: Object.entries(settingsPayload).map(([key, value]) => ({ key, value })),
      })

      if (badgeForm) {
        await adminProductBadgeService.updateProductBadgeSettings(badgeForm)
      }
    },
    onSuccess: () => {
      setSaveMessage('All settings saved successfully.')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'product-badges'] })
      window.setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  const globalSettingKeys = useMemo(() => sortGlobalSettingKeys(Object.keys(globalForm)), [globalForm])

  const updateGlobalSetting = (key: string, value: unknown) => {
    setGlobalForm((current) => ({ ...current, [key]: value }))
  }

  const handleDiscardAll = () => {
    if (settingsQuery.data?.data && typeof settingsQuery.data.data === 'object') {
      setGlobalForm(buildGlobalForm(settingsQuery.data.data as Record<string, unknown>))
    } else {
      setGlobalForm(buildGlobalForm({}))
    }
    if (badgeQuery.data?.data) {
      setBadgeForm(badgeQuery.data.data)
    }
    saveAllSettings.reset()
    setSaveMessage(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login/admin')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <section>
        <div className="flex flex-col items-center gap-6 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 stitch-card-shadow md:flex-row">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-primary-container/20">
            <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="mb-1 text-headline-xl text-on-surface">{user?.name ?? 'Super Admin'}</h3>
            <p className="mb-4 max-w-2xl text-body-lg text-on-surface-variant">
              Platform oversight for {APP_NAME} marketplace operations, seller verification, and
              catalog moderation.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              <span className="rounded-full bg-tertiary-fixed px-4 py-1 text-xs font-bold tracking-wider text-on-tertiary-fixed uppercase">
                Admin Access
              </span>
              <span className="rounded-full bg-secondary-fixed px-4 py-1 text-xs font-bold tracking-wider text-on-secondary-fixed uppercase">
                {user?.role ?? 'staff'}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/buyer')}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-on-primary shadow-[0px_8px_24px_rgba(46,125,50,0.12)] transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">swap_horiz</span>
              Switch to Buyer Mode
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-6 py-3 font-bold text-secondary transition-colors hover:bg-secondary/5"
            >
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h4 className="mb-1 text-headline-lg text-on-surface">Administrative Controls</h4>
            <p className="text-body-md text-on-surface-variant">
              Configure core platform behavior and security protocols.
            </p>
          </div>
        </div>

        <div className="admin-bento-grid mb-8">
          <SettingsBentoCard
            icon="admin_panel_settings"
            title="Role Permissions"
            description="Manage hierarchical access levels for employees, vendors, and regional managers."
            className="admin-bento-span-2 admin-bento-row-2"
          >
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
                <span className="text-body-md font-medium text-on-surface">Admin routes</span>
                <span className="font-bold text-primary">Active</span>
              </div>
            </div>
          </SettingsBentoCard>

          <SettingsBentoCard
            icon="tune"
            title="App Configurations"
            description="Main system flags and API integrations."
            className="admin-bento-span-2"
          />

          <SettingsBentoCard
            icon="payments"
            title="Platform Fees"
            description="Commission and delivery pricing settings."
          />

          <SettingsBentoCard icon="history_edu" title="Audit Logs" description="Full transparency trail." />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h4 className="text-headline-lg text-on-surface">Delivery Zones</h4>
          <p className="text-body-md text-on-surface-variant">
            Manage pincode serviceability and zone-specific delivery charges.
          </p>
        </div>

        {deliveryQuery.error ? (
          <p className="text-body-md text-error">
            {getApiErrorMessage(deliveryQuery.error, 'Failed to load delivery settings')}
          </p>
        ) : null}

        <div className="stitch-card-shadow space-y-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <p className="text-body-md text-on-surface-variant">
            Module status:{' '}
            <span className="font-semibold text-on-surface">
              {deliveryQuery.data?.data?.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </p>

          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              createZone.mutate()
            }}
          >
            <input
              required
              value={zonePincode}
              onChange={(e) => setZonePincode(e.target.value)}
              placeholder="Pincode"
              className="rounded-lg border border-outline-variant px-3 py-2"
            />
            <input
              value={zoneCity}
              onChange={(e) => setZoneCity(e.target.value)}
              placeholder="City"
              className="rounded-lg border border-outline-variant px-3 py-2"
            />
            <input
              value={zoneCharge}
              onChange={(e) => setZoneCharge(e.target.value)}
              placeholder="Charge"
              className="w-24 rounded-lg border border-outline-variant px-3 py-2"
            />
            <button
              type="submit"
              disabled={createZone.isPending}
              className="rounded-lg bg-primary px-4 py-2 font-bold text-on-primary"
            >
              Add zone
            </button>
          </form>
          {createZone.isError ? (
            <p className="text-sm text-error">{getApiErrorMessage(createZone.error, 'Could not add zone')}</p>
          ) : null}

          {deliveryQuery.isLoading ? (
            <p className="text-body-md text-on-surface-variant">Loading zones…</p>
          ) : deliveryZones.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No delivery zones configured yet.</p>
          ) : (
            <ul className="divide-y divide-outline-variant/30 rounded-lg border border-outline-variant/30">
              {deliveryZones.map((zone) => (
                <li key={zone.id} className="flex items-center justify-between gap-3 px-4 py-3 text-body-md">
                  <div>
                    <p className="font-semibold text-on-surface">
                      {zone.pincode}
                      {zone.city ? ` · ${zone.city}` : ''}
                    </p>
                    <p className="text-label-md text-on-surface-variant">
                      ₹{zone.delivery_charge ?? '—'} · {zone.is_serviceable === false ? 'Not serviceable' : 'Serviceable'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-error"
                    onClick={() => deleteZone.mutate(zone.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h4 className="text-headline-lg text-on-surface">Product Badge Settings</h4>
          <p className="text-body-md text-on-surface-variant">
            Control when buyer-facing product labels appear using simple rules for each badge type.
          </p>
        </div>

        {badgeQuery.error ? (
          <p className="text-body-md text-error">{getApiErrorMessage(badgeQuery.error, 'Failed to load badge settings')}</p>
        ) : null}

        {badgeQuery.isLoading || !badgeForm ? (
          <p className="text-body-md text-on-surface-variant">Loading badge settings…</p>
        ) : (
          <ProductBadgeSettingsForm value={badgeForm} onChange={setBadgeForm} />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h4 className="text-headline-lg text-on-surface">Global Settings</h4>
          <p className="text-body-md text-on-surface-variant">
            Platform-wide configuration for site info, payments, and delivery.
          </p>
        </div>

        {saveMessage ? (
          <p className="rounded-xl border border-primary/20 bg-primary-container/10 px-3 py-2 text-body-md text-primary">
            {saveMessage}
          </p>
        ) : null}
        {saveAllSettings.error ? (
          <p className="rounded-xl border border-error/20 bg-error-container/20 px-3 py-2 text-body-md text-error">
            {getApiErrorMessage(saveAllSettings.error, 'Failed to save settings')}
          </p>
        ) : null}

        {settingsQuery.isLoading ? (
          <p className="text-body-md text-on-surface-variant">Loading settings…</p>
        ) : settingsQuery.error ? (
          <p className="text-body-md text-error">{getApiErrorMessage(settingsQuery.error, 'Failed to load settings')}</p>
        ) : (
          <form
            className="stitch-card-shadow space-y-6 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6"
            onSubmit={(e) => {
              e.preventDefault()
              saveAllSettings.mutate(globalForm)
            }}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {globalSettingKeys.map((key) => (
                <GlobalSettingField
                  key={key}
                  settingKey={key}
                  value={globalForm[key]}
                  onChange={(value) => updateGlobalSetting(key, value)}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-outline-variant/30 pt-6 md:justify-end">
              <button
                type="button"
                onClick={handleDiscardAll}
                className="rounded-xl border border-outline-variant px-5 py-2.5 font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                Discard changes
              </button>
              <button
                type="submit"
                disabled={saveAllSettings.isPending}
                className="rounded-xl bg-primary px-6 py-2.5 text-label-md font-bold text-on-primary disabled:opacity-50"
              >
                {saveAllSettings.isPending ? 'Saving…' : 'Save all settings'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
