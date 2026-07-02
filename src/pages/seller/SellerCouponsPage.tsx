import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pagination } from '@/components/ui/Pagination'
import { CouponFormModal } from '@/components/coupons/CouponFormModal'
import {
  createSellerCoupon,
  deleteSellerCoupon,
  listSellerCoupons,
  updateSellerCoupon,
  type SellerCoupon,
} from '@/api/services/sellerCouponsService'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { formatCouponBenefit, formatCouponMeta } from '@/utils/couponLabel'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

export function SellerCouponsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'coupons', page],
    queryFn: () => listSellerCoupons({ page, per_page: 15 }),
  })

  const create = useMutation({
    mutationFn: createSellerCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'coupons'] })
      setCreateOpen(false)
    },
  })

  const toggleActive = useMutation({
    mutationFn: ({ uuid, is_active }: { uuid: string; is_active: boolean }) =>
      updateSellerCoupon(uuid, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller', 'coupons'] }),
  })

  const remove = useMutation({
    mutationFn: (uuid: string) => deleteSellerCoupon(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller', 'coupons'] }),
  })

  const rows = extractRows(data?.data) as SellerCoupon[]
  const meta = extractPaginationMeta(data)

  return (
    <div className="stitch-marketplace space-y-6 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-headline-xl text-on-surface">Store coupons</h1>
          <p className="text-body-md text-on-surface-variant">
            Set discount caps, validity dates, usage limits, and who can redeem your store promotions.
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

      <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 stitch-card-shadow">
        <h2 className="text-headline-lg text-on-surface">Your coupons</h2>
        {error ? (
          <p className="mt-3 text-body-md text-error">{getApiErrorMessage(error, 'Failed to load coupons')}</p>
        ) : isLoading ? (
          <p className="mt-3 text-body-md text-on-surface-variant">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-outline-variant/40 bg-surface p-8 text-center">
            <span className="material-symbols-outlined text-[40px] text-outline">local_offer</span>
            <p className="text-body-md mt-2 text-on-surface-variant">No store coupons yet.</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="text-label-md mt-4 font-bold text-primary hover:underline"
            >
              Create your first coupon
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((coupon) => {
              const metaLine = formatCouponMeta({ ...coupon, issuer: 'seller' })

              return (
                <article
                  key={coupon.uuid}
                  className="flex flex-col gap-3 rounded-xl border border-outline-variant/20 bg-surface p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-headline-lg font-bold text-on-surface">{coupon.title?.trim() || coupon.code}</p>
                    <p className="text-body-md text-on-surface-variant">
                      <span className="font-mono font-semibold text-on-surface">{coupon.code}</span>
                      {' · '}
                      {formatCouponBenefit(coupon)}
                    </p>
                    {metaLine ? <p className="text-label-md mt-1 text-on-surface-variant">{metaLine}</p> : null}
                    <span
                      className={cn(
                        'text-label-md mt-2 inline-flex rounded-full px-2.5 py-0.5 font-semibold',
                        coupon.is_active === false
                          ? 'bg-surface-variant text-outline'
                          : 'bg-primary-container/20 text-primary',
                      )}
                    >
                      {coupon.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        toggleActive.mutate({ uuid: coupon.uuid, is_active: coupon.is_active === false })
                      }
                      disabled={toggleActive.isPending}
                      className="rounded-lg border border-outline-variant px-3 py-2 text-label-md font-semibold text-on-surface"
                    >
                      {coupon.is_active === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(coupon.uuid)}
                      disabled={remove.isPending}
                      className="rounded-lg px-3 py-2 text-label-md font-semibold text-error"
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
      </section>

      <CouponFormModal
        open={createOpen}
        variant="seller"
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
