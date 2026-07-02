import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Pagination } from '@/components/ui/Pagination'
import { ADMIN_USER_ROLES, listUsers, type AdminUser } from '@/api/services/adminUsersService'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { formatOrderDateTime } from '@/utils/formatRelativeTime'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

function roleLabel(role: string) {
  return ADMIN_USER_ROLES.find((r) => r.value === role)?.label ?? role.replace(/_/g, ' ')
}

function StatusPill({ blocked }: { blocked?: boolean }) {
  return (
    <span
      className={cn(
        'text-label-md inline-flex rounded-full px-2.5 py-0.5 font-semibold capitalize',
        blocked ? 'bg-error-container text-error' : 'bg-primary-container/20 text-primary',
      )}
    >
      {blocked ? 'Blocked' : 'Active'}
    </span>
  )
}

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<'active' | 'blocked' | ''>('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', page, search, role, status],
    queryFn: () =>
      listUsers({
        page,
        per_page: 15,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
      }),
  })

  const rows = extractRows(data?.data) as AdminUser[]
  const meta = extractPaginationMeta(data)

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setRole('')
    setStatus('')
    setPage(1)
  }

  const hasFilters = Boolean(search || role || status)

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-headline-xl text-on-surface">Users</h1>
        <p className="text-body-md text-on-surface-variant">Search, filter, and manage platform accounts.</p>
      </header>

      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 stitch-card-shadow">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <label className="md:col-span-5">
            <span className="text-label-md text-on-surface-variant">Search</span>
            <div className="relative mt-1">
              <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, email, phone, or UUID"
                className="w-full rounded-xl border border-outline py-2.5 pr-4 pl-10 text-body-md"
              />
            </div>
          </label>

          <label className="md:col-span-3">
            <span className="text-label-md text-on-surface-variant">Role</span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                setPage(1)
              }}
              className="mt-1 w-full rounded-xl border border-outline px-4 py-2.5 text-body-md"
            >
              {ADMIN_USER_ROLES.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="text-label-md text-on-surface-variant">Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status)
                setPage(1)
              }}
              className="mt-1 w-full rounded-xl border border-outline px-4 py-2.5 text-body-md"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>

          <div className="md:col-span-2">
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl border border-outline px-4 py-2.5 text-label-md font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-body-md text-error">
          {getApiErrorMessage(error, 'Failed to load users')}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest stitch-card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-container-low">
              <tr>
                {['User', 'Contact', 'Role', 'Seller', 'Activity', 'Joined', 'Status', ''].map((header) => (
                  <th key={header} className="px-4 py-3 text-label-md font-bold text-on-surface-variant uppercase">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-on-surface-variant">
                    Loading users…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-on-surface-variant">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                rows.map((user) => (
                  <tr key={user.uuid} className="hover:bg-surface-container-low/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{user.name ?? '—'}</p>
                      <p className="text-body-sm text-on-surface-variant">{user.uuid.slice(0, 8)}…</p>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      <p>{user.phone ?? '—'}</p>
                      <p className="text-body-sm">{user.email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-on-surface">{roleLabel(user.role)}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {user.seller_store ? (
                        <>
                          <p className="text-on-surface">{user.seller_store}</p>
                          <p className="text-body-sm capitalize">{user.seller_status}</p>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                      <p>{user.stats?.orders_as_buyer ?? 0} buyer orders</p>
                      <p>{user.stats?.orders_as_seller ?? 0} seller orders</p>
                      {(user.stats?.deliveries ?? 0) > 0 ? <p>{user.stats?.deliveries} deliveries</p> : null}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {user.created_at ? formatOrderDateTime(user.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill blocked={user.is_blocked} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/users/${user.uuid}`}
                        className="text-label-md font-bold text-primary hover:underline"
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
      </div>

      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </div>
  )
}
