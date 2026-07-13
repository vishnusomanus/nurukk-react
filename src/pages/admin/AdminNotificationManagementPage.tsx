import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminNotificationsService } from '@/api/services'
import type {
  NotificationAutomation,
  NotificationCampaign,
  NotificationTemplate,
} from '@/api/services/adminNotificationsService'
import { extractRows } from '@/utils/extractRows'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const TRIGGERS = [
  { id: 'inactivity_1d', label: 'Inactive 1 day' },
  { id: 'inactivity_3d', label: 'Inactive 3 days' },
  { id: 'inactivity_7d', label: 'Inactive 7 days' },
  { id: 'no_purchase_15d', label: 'No purchase 15 days' },
  { id: 'no_purchase_30d', label: 'No purchase 30 days' },
  { id: 'welcome', label: 'Welcome' },
  { id: 'birthday', label: 'Birthday wishes' },
]

type Tab = 'send' | 'campaigns' | 'templates' | 'automations'

export function AdminNotificationManagementPage() {
  const [tab, setTab] = useState<Tab>('send')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('all')
  const [city, setCity] = useState('')
  const [deepLink, setDeepLink] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [tplName, setTplName] = useState('')
  const [tplTitle, setTplTitle] = useState('')
  const [tplBody, setTplBody] = useState('')

  const [autoName, setAutoName] = useState('')
  const [autoTrigger, setAutoTrigger] = useState('inactivity_3d')
  const [autoTitle, setAutoTitle] = useState('')
  const [autoBody, setAutoBody] = useState('')

  const queryClient = useQueryClient()

  const analytics = useQuery({
    queryKey: ['admin', 'notifications', 'analytics'],
    queryFn: () => adminNotificationsService.getAnalytics(),
  })

  const campaigns = useQuery({
    queryKey: ['admin', 'notifications', 'campaigns'],
    queryFn: () => adminNotificationsService.listCampaigns({ per_page: 20 }),
  })

  const templates = useQuery({
    queryKey: ['admin', 'notifications', 'templates'],
    queryFn: () => adminNotificationsService.listTemplates({ per_page: 20 }),
  })

  const automations = useQuery({
    queryKey: ['admin', 'notifications', 'automations'],
    queryFn: () => adminNotificationsService.listAutomations(),
  })

  const createCampaign = useMutation({
    mutationFn: () =>
      adminNotificationsService.createCampaign({
        title: title.trim(),
        body: body.trim(),
        audience,
        deep_link: deepLink.trim() || undefined,
        scheduled_at: scheduledAt || undefined,
        send_now: !scheduledAt,
        audience_filters: city.trim() ? { city: city.trim() } : undefined,
      }),
    onSuccess: async () => {
      setTitle('')
      setBody('')
      setCity('')
      setDeepLink('')
      setScheduledAt('')
      setFormError(null)
      setTab('campaigns')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Could not send notification')),
  })

  const sendExisting = useMutation({
    mutationFn: (uuid: string) => adminNotificationsService.sendCampaign(uuid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
    },
  })

  const createTemplate = useMutation({
    mutationFn: () =>
      adminNotificationsService.createTemplate({
        name: tplName.trim(),
        title: tplTitle.trim(),
        body: tplBody.trim(),
        category: 'marketing',
      }),
    onSuccess: async () => {
      setTplName('')
      setTplTitle('')
      setTplBody('')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'templates'] })
    },
  })

  const createAutomation = useMutation({
    mutationFn: () =>
      adminNotificationsService.createAutomation({
        name: autoName.trim(),
        trigger: autoTrigger,
        title: autoTitle.trim(),
        body: autoBody.trim(),
        audience: 'buyers',
        category: 'engagement',
        is_active: true,
      }),
    onSuccess: async () => {
      setAutoName('')
      setAutoTitle('')
      setAutoBody('')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'automations'] })
    },
  })

  const toggleAutomation = useMutation({
    mutationFn: ({ uuid, is_active }: { uuid: string; is_active: boolean }) =>
      adminNotificationsService.updateAutomation(uuid, { is_active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'automations'] })
    },
  })

  const stats = analytics.data?.data
  const campaignRows = extractRows(campaigns.data?.data) as NotificationCampaign[]
  const templateRows = extractRows(templates.data?.data) as NotificationTemplate[]
  const automationRows = (automations.data?.data?.items ?? []) as NotificationAutomation[]

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h1 className="text-headline-xl text-on-surface">Notification Management</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Push &amp; in-app campaigns for buyers, sellers, and delivery agents.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Devices', value: stats?.device_tokens },
          { label: 'Sent', value: stats?.total_notifications_sent },
          { label: 'Delivered', value: stats?.delivered_count },
          { label: 'Failed', value: stats?.failed_count },
          { label: 'Open rate', value: stats?.open_rate != null ? `${stats.open_rate}%` : '—' },
          { label: 'CTR', value: stats?.click_through_rate != null ? `${stats.click_through_rate}%` : '—' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl bg-surface-container-low px-4 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
              {card.label}
            </p>
            <p className="mt-1 text-xl font-bold text-on-surface">{card.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-outline-variant/30 pb-2">
        {(
          [
            ['send', 'Compose'],
            ['campaigns', 'Campaigns'],
            ['templates', 'Templates'],
            ['automations', 'Automations'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              tab === id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'send' ? (
        <div className="max-w-2xl space-y-3 rounded-2xl bg-surface-container-low p-4 md:p-5">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold tracking-wide text-outline uppercase">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
              maxLength={200}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold tracking-wide text-outline uppercase">Message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
              maxLength={2000}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold tracking-wide text-outline uppercase">Audience</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
              >
                <option value="all">All users</option>
                <option value="buyers">Buyers only</option>
                <option value="sellers">Sellers only</option>
                <option value="delivery">Delivery agents only</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold tracking-wide text-outline uppercase">City filter</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold tracking-wide text-outline uppercase">Deep link</span>
              <input
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
                placeholder="/buyer or /seller/orders/…"
                className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold tracking-wide text-outline uppercase">Schedule</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          {formError ? <p className="text-sm text-error">{formError}</p> : null}
          <button
            type="button"
            disabled={createCampaign.isPending || title.trim().length < 2 || body.trim().length < 2}
            onClick={() => createCampaign.mutate()}
            className="flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60"
          >
            {scheduledAt ? 'Schedule notification' : 'Send now'}
          </button>
        </div>
      ) : null}

      {tab === 'campaigns' ? (
        <div className="space-y-2">
          {campaigns.isLoading ? <p className="text-sm text-on-surface-variant">Loading…</p> : null}
          {campaignRows.length === 0 && !campaigns.isLoading ? (
            <p className="text-sm text-on-surface-variant">No campaigns yet.</p>
          ) : null}
          {campaignRows.map((row) => (
            <div
              key={row.uuid}
              className="flex flex-col gap-2 rounded-2xl bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-on-surface">{row.title}</p>
                <p className="truncate text-sm text-on-surface-variant">{row.body}</p>
                <p className="mt-1 text-xs text-outline">
                  {row.audience} · {row.status} · sent {row.sent_count ?? 0}/{row.target_count ?? 0}
                </p>
              </div>
              {row.status === 'draft' || row.status === 'scheduled' ? (
                <button
                  type="button"
                  disabled={sendExisting.isPending}
                  onClick={() => sendExisting.mutate(row.uuid)}
                  className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary"
                >
                  Send
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'templates' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h2 className="font-bold text-on-surface">Save template</h2>
            <input
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="Template name"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
            />
            <input
              value={tplTitle}
              onChange={(e) => setTplTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
            />
            <textarea
              value={tplBody}
              onChange={(e) => setTplBody(e.target.value)}
              placeholder="Body"
              rows={3}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={createTemplate.isPending || !tplName.trim() || !tplTitle.trim()}
              onClick={() => createTemplate.mutate()}
              className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60"
            >
              Save template
            </button>
          </div>
          <div className="space-y-2">
            {templateRows.map((row) => (
              <div key={row.uuid} className="rounded-2xl bg-surface-container-low px-4 py-3">
                <p className="font-semibold">{row.name}</p>
                <p className="text-sm text-on-surface-variant">
                  {row.title} — {row.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'automations' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h2 className="font-bold text-on-surface">New automation</h2>
            <input
              value={autoName}
              onChange={(e) => setAutoName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
            />
            <select
              value={autoTrigger}
              onChange={(e) => setAutoTrigger(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
            >
              {TRIGGERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              value={autoTitle}
              onChange={(e) => setAutoTitle(e.target.value)}
              placeholder="Title (use {{name}})"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
            />
            <textarea
              value={autoBody}
              onChange={(e) => setAutoBody(e.target.value)}
              placeholder="Message"
              rows={3}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={createAutomation.isPending || !autoName.trim() || !autoTitle.trim()}
              onClick={() => createAutomation.mutate()}
              className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60"
            >
              Create automation
            </button>
          </div>
          <div className="space-y-2">
            {automationRows.map((row) => (
              <div
                key={row.uuid}
                className="flex items-start justify-between gap-3 rounded-2xl bg-surface-container-low px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-outline">{row.trigger}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">{row.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toggleAutomation.mutate({ uuid: row.uuid, is_active: !row.is_active })
                  }
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
                    row.is_active
                      ? 'bg-primary-container/30 text-primary'
                      : 'bg-surface-container-high text-on-surface-variant',
                  )}
                >
                  {row.is_active ? 'Active' : 'Paused'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
