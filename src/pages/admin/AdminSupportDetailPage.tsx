import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminSupportService } from '@/api/services'
import { BreadcrumbBackLink } from '@/components/common/BreadcrumbBack'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-label-md text-on-surface-variant">{label}</p>
      <p className="text-body-md font-medium text-on-surface">{value}</p>
    </div>
  )
}

export function AdminSupportDetailPage() {
  const { uuid = '' } = useParams()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('open')
  const [adminNotes, setAdminNotes] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'support', uuid],
    queryFn: () => adminSupportService.getSupportTicket(uuid),
    enabled: !!uuid,
  })

  const ticket = data?.data

  useEffect(() => {
    if (!ticket) return
    setStatus(ticket.status ?? 'open')
    setAdminNotes(ticket.admin_notes ?? '')
  }, [ticket])

  const updateMutation = useMutation({
    mutationFn: () =>
      adminSupportService.updateSupportTicket(uuid, {
        status,
        admin_notes: adminNotes.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'support'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'support', uuid] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-container" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-container" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <BreadcrumbBackLink to="/admin/support" label="Support" />
        <p className="text-sm text-error">{getApiErrorMessage(error, 'Ticket not found')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <BreadcrumbBackLink to="/admin/support" label="Support" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline-xl text-on-surface">{ticket.name}</h1>
          <p className="text-sm capitalize text-on-surface-variant">
            {ticket.app} app · {String(ticket.status ?? '').replace(/_/g, ' ')}
          </p>
        </div>
        {ticket.user?.uuid ? (
          <Link to={`/admin/users/${ticket.user.uuid}`} className="text-sm font-bold text-primary">
            View user
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 lg:col-span-2">
          <h2 className="text-lg font-bold text-on-surface">Request</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Email" value={ticket.email} />
            <DetailRow label="Mobile" value={ticket.mobile} />
            <DetailRow label="Submitted" value={ticket.created_at} />
            <DetailRow
              label="Account"
              value={
                ticket.user
                  ? `${ticket.user.name ?? '—'} (${ticket.user.role ?? 'user'})`
                  : null
              }
            />
          </div>
          <div>
            <p className="text-label-md text-on-surface-variant">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-body-md text-on-surface">{ticket.description}</p>
          </div>
          {(ticket.screenshot_urls?.length ?? 0) > 0 ? (
            <div>
              <p className="mb-2 text-label-md text-on-surface-variant">Screenshots</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ticket.screenshot_urls!.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5">
          <h2 className="text-lg font-bold text-on-surface">Admin update</h2>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm"
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">Internal notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Notes for the team…"
            />
          </div>
          {updateMutation.isError ? (
            <p className="text-sm text-error">
              {getApiErrorMessage(updateMutation.error, 'Could not update ticket')}
            </p>
          ) : null}
          {updateMutation.isSuccess ? (
            <p className="text-sm font-semibold text-primary">Saved.</p>
          ) : null}
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
            className={cn(
              'flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary disabled:opacity-60',
            )}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </section>
      </div>
    </div>
  )
}
