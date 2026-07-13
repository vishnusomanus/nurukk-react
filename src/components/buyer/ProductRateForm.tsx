import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

export function ProductRateForm({
  productUuid,
  canRate = false,
  initialRating,
}: {
  productUuid: string
  canRate?: boolean
  initialRating?: number | null
}) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(initialRating && initialRating > 0 ? initialRating : 5)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (initialRating && initialRating > 0) setRating(initialRating)
  }, [initialRating])

  const rateMutation = useMutation({
    mutationFn: () => buyerService.rateProduct(productUuid, { rating }),
    onSuccess: () => {
      setSubmitted(true)
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'product', productUuid] })
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'product', productUuid, 'ratings'] })
    },
  })

  if (!canRate && !initialRating) {
    return (
      <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
        <h3 className="text-[15px] font-bold text-on-surface">Rate this product</h3>
        <p className="mt-2 text-sm text-on-surface-variant">
          Purchase and receive this product to leave a rating.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
      <h3 className="text-[15px] font-bold text-on-surface">
        {initialRating ? 'Update your rating' : 'Rate this product'}
      </h3>
      <p className="mt-1 mb-4 text-sm text-on-surface-variant">Tap a star rating</p>

      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={!canRate}
            onClick={() => {
              setRating(value)
              setSubmitted(false)
            }}
            className="rounded-full p-1.5 transition-transform active:scale-90 disabled:opacity-50"
            aria-label={`${value} stars`}
          >
            <span
              className={cn(
                'material-symbols-outlined text-[32px]',
                value <= rating ? 'text-secondary' : 'text-outline-variant',
              )}
              style={{ fontVariationSettings: value <= rating ? "'FILL' 1" : undefined }}
            >
              star
            </span>
          </button>
        ))}
      </div>

      {rateMutation.isError ? (
        <p className="mb-2 text-sm text-error">
          {getApiErrorMessage(rateMutation.error, 'Could not submit rating')}
        </p>
      ) : null}
      {submitted && !rateMutation.isError ? (
        <p className="mb-2 text-sm font-semibold text-primary">Thanks — rating saved.</p>
      ) : null}

      <button
        type="button"
        disabled={!canRate || rateMutation.isPending}
        onClick={() => rateMutation.mutate()}
        className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {rateMutation.isPending
          ? 'Submitting…'
          : initialRating
            ? 'Update rating'
            : 'Submit rating'}
      </button>
    </section>
  )
}
