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
    <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none">
      <h3 className="text-[15px] font-bold text-on-surface lg:text-base">Rate your order</h3>
      <p className="mt-1 mb-4 text-sm text-on-surface-variant">How was your experience?</p>
      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className="rounded-full p-1.5 transition-transform active:scale-90"
            aria-label={`${value} stars`}
          >
            <span
              className="material-symbols-outlined text-[32px] text-secondary"
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
        className="mb-3 w-full rounded-xl border-none bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary lg:border lg:border-outline-variant/40"
      />
      {rateMutation.isError ? (
        <p className="mb-2 text-sm text-error">{getApiErrorMessage(rateMutation.error, 'Could not submit rating')}</p>
      ) : null}
      <button
        type="button"
        disabled={rateMutation.isPending}
        onClick={() => rateMutation.mutate()}
        className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {rateMutation.isPending ? 'Submitting…' : 'Submit rating'}
      </button>
    </div>
  )
}
