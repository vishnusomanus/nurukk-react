import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminSupportService } from '@/api/services'
import type { AdminSupportTicket } from '@/api/services/adminSupportService'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

function statusClass(status?: string) {
  switch (status) {
    case 'resolved':
      return 'bg-primary-container/20 text-primary'
    case 'in_progress':
      return 'bg-amber-100 text-amber-900'
    case 'closed':
      return 'bg-surface-container-high text-on-surface-variant'
    default:
      return 'bg-secondary-container/30 text-on-secondary-container'
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AdminSupportPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [app, setApp] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'support', page, status, app, search],
    queryFn: () =>
      adminSupportService.listSupportTickets({
        page,
        per_page: 15,
        status: status || undefined,
        app: app || undefined,
        search: search || undefined,
      }),
  })

  const rows = extractRows(data?.data) as AdminSupportTicket[]
  const meta = extractPaginationMeta(data)

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-headline-xl text-on-surface">Help & Support</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Requests from buyer, seller, and delivery apps.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1)
              setSearch(searchInput.trim())
            }
          }}
          placeholder="Search name, email, mobile…"
          className="h-10 min-w-[220px] flex-1 rounded-lg border border-outline-variant bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={app}
          onChange={(e) => {
            setPage(1)
            setApp(e.target.value)
          }}
          className="h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm"
        >
          <option value="">All apps</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="delivery">Delivery</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
          className="h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setPage(1)
            setSearch(searchInput.trim())
          }}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary"
        >
          Search
        </button>
      </div>

      {error ? <p className="text-sm text-error">{getApiErrorMessage(error, 'Failed to load')}</p> : null}

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 text-on-surface">Contact</th>
              <th className="px-4 py-3 text-on-surface">App</th>
              <th className="px-4 py-3 text-on-surface">Status</th>
              <th className="px-4 py-3 text-on-surface">Submitted</th>
              <th className="px-4 py-3 text-on-surface" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-on-surface-variant">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-on-surface-variant">
                  No support requests yet
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.uuid} className="border-t border-outline-variant/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-on-surface">{row.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {row.email} · {row.mobile}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize text-on-surface">{row.app}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize',
                        statusClass(row.status),
                      )}
                    >
                      {String(row.status ?? 'open').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/support/${row.uuid}`}
                      className="text-sm font-bold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </div>
  )
}
