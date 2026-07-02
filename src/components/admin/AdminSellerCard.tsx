import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdminSeller } from '@/api/services/adminSellersService'
import { approveSeller, rejectSeller } from '@/api/services/adminSellersService'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const PLACEHOLDER_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAR80zlv0tQaqIYYGBvxdKuKvKANI7vAHgXmYAoPrRVmqXrUoeo-0UFi1d9eE3oe-xL46jMcQcJMYKBCPT3Y2IQ16rKeVrMHE-bbfTipFOLc8BCFlRahTor3sa5_Mjg420kNdUBpGMyCfhugY4t6xQhbEJXcqRHO3BSyzDk2Co9EEWdpICOQZPv9Zihm_1Vo7bvoWEjjNIPXO2OxV_lNHHrIfTcZPysz0588PA5vYyITt-HJaCrtu3FjmlCYv6LyXUyIiW93mIv5zeU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBKBljwUpM2tWaVnAoI2od76rhU3mzClRJf9HSS0mcHhn65e2d-k8WM_I0VFiWMVBpnAGSBD-sA9DE0-OgFxhWuZ4n51Dw-uP-zLJCyC56pV3Cp0AnPD0ZaqvzA54aZbuPNEL6qATfar_9HvkhBqGlXg07w6zF1hr5yCuDISXIBsn2axG5377Z0oqjlAfyqXOTYDqsyc_5pmu9u2DCauQ03NW52-uku8Y3-2qOPdoPrLWK7rW54ceh25ZH2PBfAnwiurMRreKtTpBI3',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCOlLTM5Ra_l4u-vHA1avUFC-ZvXpLRjh4jPARtylAPWNyCvj9oNQXdTy9kPa39I03Phjedm1JG-wmIzTvxy9NRxlX0SygpgnL2Ghz4G6c5LZIap_7um1EwGk50GLDYnaCR1jMBt67vbIxlN3i2bAime1Jepc4wLuNsM923Spgac5VyisObvMEbkS0_1UsgsvPU1p9pBjq96SBzX4dawo78z2MmrwUWFmatZ8_zBHlcX0POSFABmhqlWm3AhbiZsGTOebiFsQ7wfT0V',
]

function statusBadge(status: string) {
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-1 text-label-md text-primary backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        New Application
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="rounded-full bg-white/90 px-4 py-1 text-label-md text-error backdrop-blur">
        Rejected
      </span>
    )
  }
  return (
    <span className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-1 text-label-md text-secondary backdrop-blur">
      <span className="material-symbols-outlined text-[14px]">schedule</span>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

type AdminSellerCardProps = {
  seller: AdminSeller
  imageIndex?: number
}

export function AdminSellerCard({ seller, imageIndex = 0 }: AdminSellerCardProps) {
  const queryClient = useQueryClient()
  const location = [seller.city, seller.pincode].filter(Boolean).join(', ') || 'Location pending'
  const image = PLACEHOLDER_IMAGES[imageIndex % PLACEHOLDER_IMAGES.length]
  const isPending = seller.status === 'pending'

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }

  const approve = useMutation({
    mutationFn: () => approveSeller(seller.uuid),
    onSuccess: invalidate,
  })

  const reject = useMutation({
    mutationFn: () => rejectSeller(seller.uuid),
    onSuccess: invalidate,
  })

  const busy = approve.isPending || reject.isPending
  const error = approve.error ?? reject.error

  return (
    <div className="stitch-glass-card overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-[0px_8px_24px_rgba(46,125,50,0.12)]">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent" />
        <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute top-4 left-4 z-20">{statusBadge(seller.status)}</div>
      </div>

      <div className="p-6">
        <h3 className="text-headline-lg text-on-surface">{seller.name}</h3>
        <div className="mb-4 flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">location_on</span>
          <span className="text-body-md">{location}</span>
        </div>

        {seller.description ? (
          <p className="mb-4 line-clamp-2 text-body-md text-on-surface-variant">{seller.description}</p>
        ) : null}

        <div className="mb-6 rounded-lg bg-surface-container-low p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-body-md text-on-surface-variant">Contact</span>
            <span className="text-label-md text-primary">{seller.phone ?? '—'}</span>
          </div>
          {seller.approval_notes ? (
            <p className="text-body-md text-on-surface-variant italic">{seller.approval_notes}</p>
          ) : null}
        </div>

        {isPending ? (
          <div className="flex gap-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => approve.mutate()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-label-md text-on-primary transition-all hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => reject.mutate()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-outline-variant py-3 text-label-md text-error transition-all hover:bg-error-container/10"
            >
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              Reject
            </button>
          </div>
        ) : (
          <div
            className={cn(
              'rounded-lg px-4 py-2 text-center text-label-md uppercase',
              seller.status === 'approved'
                ? 'bg-primary-container/10 text-primary'
                : 'bg-error-container/30 text-error',
            )}
          >
            {seller.status}
          </div>
        )}

        {error ? (
          <p className="mt-3 text-sm text-error">{getApiErrorMessage(error, 'Action failed')}</p>
        ) : null}
      </div>
    </div>
  )
}

type AdminSellerUrgentRowProps = {
  seller: AdminSeller
}

export function AdminSellerUrgentRow({ seller }: AdminSellerUrgentRowProps) {
  const queryClient = useQueryClient()

  const approve = useMutation({
    mutationFn: () => approveSeller(seller.uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })

  const reject = useMutation({
    mutationFn: () => rejectSeller(seller.uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })

  return (
    <div className="group flex gap-4 rounded-lg border border-transparent p-4 transition-all hover:border-outline-variant/30 hover:bg-surface-variant/20">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
        <span className="material-symbols-outlined text-primary">person_search</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h5 className="truncate text-label-md text-on-surface">New Seller: {seller.name}</h5>
          <Link to="/admin/sellers" className="text-[10px] font-medium text-on-surface-variant whitespace-nowrap">
            Review
          </Link>
        </div>
        <p className="mb-3 line-clamp-1 text-[12px] text-on-surface-variant">
          Application pending verification{seller.city ? ` in ${seller.city}` : ''}.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={approve.isPending}
            onClick={() => approve.mutate()}
            className="rounded bg-primary px-3 py-1 text-[10px] font-bold text-on-primary"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={reject.isPending}
            onClick={() => reject.mutate()}
            className="rounded bg-surface-variant px-3 py-1 text-[10px] font-bold text-on-surface-variant"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
