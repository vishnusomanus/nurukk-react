import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

export type OrderProductRateItem = {
  productUuid: string
  productName?: string
  initialRating?: number | null
}

function StarRow({
  value,
  onChange,
  productName,
}: {
  value: number
  onChange: (value: number) => void
  productName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface">
        {productName ?? 'Product'}
      </p>
      <div className="flex shrink-0 gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded-full p-0.5 transition-transform active:scale-90"
            aria-label={`${productName ?? 'Product'}: ${star} stars`}
          >
            <span
              className={cn(
                'material-symbols-outlined text-[26px]',
                star <= value ? 'text-secondary' : 'text-outline-variant',
              )}
              style={{ fontVariationSettings: star <= value ? "'FILL' 1" : undefined }}
            >
              star
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function OrderRateForm({
  orderUuid,
  products,
}: {
  orderUuid: string
  products: OrderProductRateItem[]
}) {
  const queryClient = useQueryClient()
  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      products.map((p) => [p.productUuid, p.initialRating && p.initialRating > 0 ? p.initialRating : 5]),
    ),
  )
  const [submitted, setSubmitted] = useState(false)

  const productsKey = products
    .map((p) => `${p.productUuid}:${p.initialRating ?? ''}`)
    .join('|')

  useEffect(() => {
    setRatings(
      Object.fromEntries(
        products.map((p) => [
          p.productUuid,
          p.initialRating && p.initialRating > 0 ? p.initialRating : 5,
        ]),
      ),
    )
    // Sync when server ratings / product set change, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- productsKey captures meaningful changes
  }, [productsKey])

  const rateMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        products.map((p) =>
          buyerService.rateOrder(orderUuid, {
            rating: ratings[p.productUuid] ?? 5,
            product_uuid: p.productUuid,
          }),
        ),
      )
    },
    onSuccess: () => {
      setSubmitted(true)
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'order', orderUuid] })
      for (const p of products) {
        void queryClient.invalidateQueries({ queryKey: ['buyer', 'product', p.productUuid] })
      }
    },
  })

  if (products.length === 0) return null

  const allAlreadyRated = products.every((p) => p.initialRating && p.initialRating > 0)

  return (
    <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none">
      <h3 className="text-[15px] font-bold text-on-surface lg:text-base">Rate products</h3>
      <p className="mt-1 mb-2 text-sm text-on-surface-variant">
        Tap stars for each item, then save once.
      </p>

      <div className="divide-y divide-outline-variant/25">
        {products.map((product) => (
          <StarRow
            key={product.productUuid}
            productName={product.productName}
            value={ratings[product.productUuid] ?? 5}
            onChange={(value) => {
              setRatings((prev) => ({ ...prev, [product.productUuid]: value }))
              setSubmitted(false)
            }}
          />
        ))}
      </div>

      {rateMutation.isError ? (
        <p className="mt-3 text-sm text-error">
          {getApiErrorMessage(rateMutation.error, 'Could not save product ratings')}
        </p>
      ) : null}
      {submitted && !rateMutation.isError ? (
        <p className="mt-3 text-sm font-semibold text-primary">Thanks — product ratings saved.</p>
      ) : null}

      <button
        type="button"
        disabled={rateMutation.isPending}
        onClick={() => rateMutation.mutate()}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {rateMutation.isPending
          ? 'Saving…'
          : allAlreadyRated
            ? 'Update product ratings'
            : 'Save product ratings'}
      </button>
    </section>
  )
}
