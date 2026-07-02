import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pagination } from '@/components/ui/Pagination'
import { CouponFormModal } from '@/components/coupons/CouponFormModal'
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  type AdminCoupon,
  type CouponIssuer,
} from '@/api/services/adminCouponsService'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { formatCouponBenefit, formatCouponMeta } from '@/utils/couponLabel'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type IssuerTab = CouponIssuer | 'all'

function IssuerBadge({ coupon }: { coupon: AdminCoupon }) {
  const isPlatform = coupon.issuer !== 'seller'

  return (
    <span
      className={cn(
        'text-label-md inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold',
        isPlatform ? 'bg-secondary-container/30 text-secondary' : 'bg-primary-container/20 text-primary',
      )}
    >
      <span className="material-symbols-outlined text-[14px]">{isPlatform ? 'verified' : 'storefront'}</span>
      {isPlatform ? 'Platform' : coupon.seller?.store_name ?? 'Seller'}
    </span>
  )
}

function ActivePill({ active }: { active?: boolean }) {
  return (
    <span
      className={cn(
        'text-label-md inline-flex rounded-full px-2.5 py-0.5 font-semibold',
        active === false ? 'bg-surface-variant text-outline' : 'bg-primary-container/20 text-primary',
      )}
    >
      {active === false ? 'Inactive' : 'Active'}
    </span>
  )
}

export function CouponsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [issuerTab, setIssuerTab] = useState<IssuerTab>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'coupons', page, issuerTab, search],
    queryFn: () =>
      listCoupons({
        page,
        per_page: 15,
        issuer: issuerTab,
        search: search || undefined,
      }),
  })

  const create = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      setCreateOpen(false)
    },
  })

  const toggleActive = useMutation({
    mutationFn: ({ uuid, is_active }: { uuid: string; is_active: boolean }) =>
      updateCoupon(uuid, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })

  const remove = useMutation({
    mutationFn: (uuid: string) => deleteCoupon(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })

  const rows = extractRows(data?.data) as AdminCoupon[]
  const meta = extractPaginationMeta(data)

  const tabs: { id: IssuerTab; label: string; icon: string }[] = [
    { id: 'all', label: 'All coupons', icon: 'local_offer' },
    { id: 'platform', label: 'Platform', icon: 'verified' },
    { id: 'seller', label: 'Seller stores', icon: 'storefront' },
  ]

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-headline-xl text-on-surface">Coupons & offers</h1>
          <p className="text-body-md text-on-surface-variant">
            Manage platform-wide promotions with usage limits, validity windows, and user eligibility rules.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="text-label-md inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-on-primary"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create coupon
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setIssuerTab(tab.id)
              setPage(1)
            }}
            className={cn(
              'text-label-md inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition-colors',
              issuerTab === tab.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant/60',
            )}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 stitch-card-shadow">
        <div className="mb-4">
          <label className="block">
            <span className="text-label-md text-on-surface-variant">Search coupons</span>
            <div className="relative mt-1">
              <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Code or title"
                className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 pr-3 pl-10 text-body-md text-on-surface outline-none focus:border-primary"
              />
            </div>
          </label>
        </div>

        {error ? (
          <p className="text-body-md text-error">{getApiErrorMessage(error, 'Failed to load coupons')}</p>
        ) : isLoading ? (
          <p className="text-body-md text-on-surface-variant">Loading coupons…</p>
        ) : rows.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No coupons found.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((coupon) => {
              const metaLine = formatCouponMeta(coupon)

              return (
                <article
                  key={coupon.uuid}
                  className="flex flex-col gap-3 rounded-xl border border-outline-variant/20 bg-surface p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <IssuerBadge coupon={coupon} />
                      <ActivePill active={coupon.is_active} />
                    </div>
                    <div>
                      <p className="text-headline-lg font-bold text-on-surface">
                        {coupon.title?.trim() || coupon.code}
                      </p>
                      <p className="text-body-md text-on-surface-variant">
                        Code <span className="font-mono font-semibold text-on-surface">{coupon.code}</span>
                        {' · '}
                        {formatCouponBenefit(coupon)}
                      </p>
                      {metaLine ? <p className="text-label-md mt-1 text-on-surface-variant">{metaLine}</p> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        toggleActive.mutate({ uuid: coupon.uuid, is_active: coupon.is_active === false })
                      }
                      disabled={toggleActive.isPending}
                      className="rounded-lg border border-outline-variant px-3 py-2 text-label-md font-semibold text-on-surface hover:bg-surface-variant/40"
                    >
                      {coupon.is_active === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(coupon.uuid)}
                      disabled={remove.isPending}
                      className="rounded-lg px-3 py-2 text-label-md font-semibold text-error hover:bg-error-container/20"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {meta ? <div className="mt-4"><Pagination meta={meta} onPageChange={setPage} /></div> : null}
      </div>

      <CouponFormModal
        open={createOpen}
        variant="platform"
        saving={create.isPending}
        error={create.isError ? create.error : null}
        onClose={() => {
          if (!create.isPending) setCreateOpen(false)
        }}
        onSubmit={(payload) => create.mutate(payload)}
      />
    </div>
  )
}
