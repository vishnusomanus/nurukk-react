import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

export function OrderRateForm({
  orderUuid,
  onRated,
}: {
  orderUuid: string
  onRated?: () => void
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const rateMutation = useMutation({
    mutationFn: () => buyerService.rateOrder(orderUuid, { rating, comment: comment.trim() || undefined }),
    onSuccess: () => onRated?.(),
  })

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <h3 className="text-headline-lg-mobile mb-2 text-on-surface">Rate your order</h3>
      <p className="text-body-md mb-4 text-on-surface-variant">How was your fresh harvest experience?</p>
      <div className="mb-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className="rounded-full p-1"
            aria-label={`${value} stars`}
          >
            <span
              className="material-symbols-outlined text-3xl text-secondary"
              style={{ fontVariationSettings: value <= rating ? "'FILL' 1" : undefined }}
            >
              star
            </span>
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Optional feedback…"
        className="text-body-md mb-3 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2"
      />
      {rateMutation.isError ? (
        <p className="mb-2 text-sm text-error">{getApiErrorMessage(rateMutation.error, 'Could not submit rating')}</p>
      ) : null}
      <button
        type="button"
        disabled={rateMutation.isPending}
        onClick={() => rateMutation.mutate()}
        className="rounded-lg bg-primary px-4 py-2 font-bold text-on-primary disabled:opacity-60"
      >
        {rateMutation.isPending ? 'Submitting…' : 'Submit rating'}
      </button>
    </div>
  )
}
