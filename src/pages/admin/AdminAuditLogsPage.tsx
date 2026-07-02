import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAuditService, type AuditLogEntry } from '@/api/services'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { formatOrderDateTime, formatRelativeTime } from '@/utils/formatRelativeTime'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const ENTITY_FILTERS = [
  { value: '', label: 'All entities' },
  { value: 'user', label: 'Users' },
  { value: 'order', label: 'Orders' },
  { value: 'seller_profile', label: 'Sellers' },
  { value: 'coupon', label: 'Coupons' },
]

function actionTone(action?: string): string {
  if (!action) return 'bg-surface-container-high text-on-surface-variant'

  if (['login', 'verify_otp', 'request_otp', 'logout', 'refresh_token'].includes(action)) {
    return 'bg-primary-container/15 text-primary'
  }

  if (['user_block', 'seller_reject', 'order_refund', 'coupon_delete'].includes(action)) {
    return 'bg-error-container/40 text-error'
  }

  if (['seller_approve', 'coupon_create', 'order_status_update', 'coupon_update'].includes(action)) {
    return 'bg-tertiary-container/20 text-tertiary'
  }

  return 'bg-surface-container-high text-on-surface-variant'
}

function formatActor(actor?: AuditLogEntry['actor']): string {
  if (!actor) return 'System'
  const name = actor.name?.trim() || actor.email?.trim() || 'Unknown user'
  const role = actor.role ? ` (${actor.role})` : ''
  return `${name}${role}`
}

function formatChangeLog(changeLog?: Record<string, unknown> | null): string {
  if (!changeLog || Object.keys(changeLog).length === 0) return 'No additional details recorded.'

  try {
    return JSON.stringify(changeLog, null, 2)
  } catch {
    return String(changeLog)
  }
}

function AuditLogDetails({ log }: { log: AuditLogEntry }) {
  return (
    <div className="grid gap-4 border-t border-outline-variant/30 bg-surface-container-low/60 px-4 py-4 md:grid-cols-2">
      <div className="space-y-3">
        <div>
          <p className="text-label-md tracking-wider text-on-surface-variant uppercase">Summary</p>
          <p className="text-body-md mt-1 text-on-surface">{log.summary ?? '—'}</p>
        </div>
        <div>
          <p className="text-label-md tracking-wider text-on-surface-variant uppercase">Actor</p>
          <p className="text-body-md mt-1 text-on-surface">{formatActor(log.actor)}</p>
          {log.actor?.email ? (
            <p className="text-body-md text-on-surface-variant">{log.actor.email}</p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-label-md tracking-wider text-on-surface-variant uppercase">Entity</p>
            <p className="text-body-md mt-1 text-on-surface">
              {log.entity ?? '—'}
              {log.entity_id != null ? ` #${log.entity_id}` : ''}
            </p>
          </div>
          <div>
            <p className="text-label-md tracking-wider text-on-surface-variant uppercase">IP address</p>
            <p className="text-body-md mt-1 text-on-surface">{log.ip_address ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-label-md tracking-wider text-on-surface-variant uppercase">Change log</p>
          <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3 text-xs leading-relaxed whitespace-pre-wrap text-on-surface">
            {formatChangeLog(log.change_log)}
          </pre>
        </div>
        {log.user_agent ? (
          <div>
            <p className="text-label-md tracking-wider text-on-surface-variant uppercase">User agent</p>
            <p className="text-body-md mt-1 break-all text-on-surface-variant">{log.user_agent}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'audit-logs', page, search, entity],
    queryFn: () =>
      adminAuditService.listAuditLogs({
        page,
        per_page: 20,
        search: search || undefined,
        entity: entity || undefined,
      }),
  })

  const rows = extractRows(data?.data) as AuditLogEntry[]
  const meta = extractPaginationMeta(data)

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-headline-xl text-on-surface">Audit logs</h1>
        <p className="text-body-md mt-1 text-on-surface-variant">
          Track sign-ins, admin actions, and system changes with actor, IP, and change details.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 md:flex-row md:items-end">
        <form
          className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search action, user, email, IP…"
            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-label-md font-bold text-on-primary"
          >
            Search
          </button>
        </form>

        <label className="flex flex-col gap-1">
          <span className="text-label-md text-on-surface-variant">Entity</span>
          <select
            value={entity}
            onChange={(event) => {
              setEntity(event.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
          >
            {ENTITY_FILTERS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-body-md text-error">
          {getApiErrorMessage(error, 'Failed to load audit logs')}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-surface-container-low">
              <tr>
                {['When', 'Action', 'Summary', 'Actor', 'Entity', 'IP', ''].map((header) => (
                  <th
                    key={header || 'expand'}
                    className="text-label-md px-4 py-3 font-bold tracking-wider text-on-surface-variant uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-body-md text-on-surface-variant">
                    Loading audit logs…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-body-md text-on-surface-variant">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                rows.map((log) => {
                  const isExpanded = expandedId === log.id

                  return (
                    <tr key={log.id} className="border-t border-outline-variant/30 align-top">
                      <td colSpan={7} className="p-0">
                        <div className="grid grid-cols-[minmax(140px,1fr)_minmax(120px,0.8fr)_minmax(220px,2fr)_minmax(160px,1.2fr)_minmax(100px,0.8fr)_minmax(110px,0.8fr)_48px] items-start gap-0">
                          <div className="px-4 py-3">
                            <p className="text-body-md font-medium text-on-surface">
                              {formatOrderDateTime(log.created_at)}
                            </p>
                            <p className="text-label-md text-on-surface-variant">
                              {formatRelativeTime(log.created_at)}
                            </p>
                          </div>
                          <div className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase',
                                actionTone(log.action),
                              )}
                            >
                              {log.action_label ?? log.action ?? '—'}
                            </span>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-body-md text-on-surface">{log.summary ?? '—'}</p>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-body-md text-on-surface">{formatActor(log.actor)}</p>
                            {log.actor?.email ? (
                              <p className="text-label-md text-on-surface-variant">{log.actor.email}</p>
                            ) : null}
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-body-md text-on-surface">{log.entity ?? '—'}</p>
                            {log.entity_id != null ? (
                              <p className="text-label-md text-on-surface-variant">#{log.entity_id}</p>
                            ) : null}
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-body-md text-on-surface">{log.ip_address ?? '—'}</p>
                          </div>
                          <div className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Hide details' : 'Show details'}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                          </div>
                        </div>
                        {isExpanded ? <AuditLogDetails log={log} /> : null}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </div>
  )
}
