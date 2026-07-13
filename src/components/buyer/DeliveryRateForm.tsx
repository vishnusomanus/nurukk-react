import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

export function DeliveryRateForm({
  orderUuid,
  riderName,
  initialRating,
  initialComment,
}: {
  orderUuid: string
  riderName?: string | null
  initialRating?: number | null
  initialComment?: string | null
}) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(initialRating && initialRating > 0 ? initialRating : 5)
  const [comment, setComment] = useState(initialComment ?? '')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (initialRating && initialRating > 0) setRating(initialRating)
    if (initialComment != null) setComment(initialComment)
  }, [initialRating, initialComment])

  const rateMutation = useMutation({
    mutationFn: () =>
      buyerService.rateDelivery(orderUuid, {
        rating,
        comment: comment.trim(),
      }),
    onSuccess: () => {
      setSubmitted(true)
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'order', orderUuid] })
    },
  })

  const canSubmit = comment.trim().length >= 3

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none">
      <h3 className="text-[15px] font-bold text-on-surface lg:text-base">
        {initialRating ? 'Update rider rating' : 'Rate your rider'}
      </h3>
      {riderName ? (
        <p className="mt-1 text-sm font-medium text-on-surface">{riderName}</p>
      ) : null}
      <p className="mt-1 mb-4 text-sm text-on-surface-variant">
        Rating and a short comment are required.
      </p>

      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setRating(value)
              setSubmitted(false)
            }}
            className="rounded-full p-1.5 transition-transform active:scale-90"
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

      <textarea
        value={comment}
        onChange={(e) => {
          setComment(e.target.value)
          setSubmitted(false)
        }}
        rows={3}
        required
        placeholder="How was the delivery experience?"
        className="mb-3 w-full rounded-xl border-none bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary lg:border lg:border-outline-variant/40"
      />

      {rateMutation.isError ? (
        <p className="mb-2 text-sm text-error">
          {getApiErrorMessage(rateMutation.error, 'Could not submit rider rating')}
        </p>
      ) : null}
      {submitted && !rateMutation.isError ? (
        <p className="mb-2 text-sm font-semibold text-primary">Thanks — rider feedback saved.</p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit || rateMutation.isPending}
        onClick={() => rateMutation.mutate()}
        className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {rateMutation.isPending
          ? 'Submitting…'
          : initialRating
            ? 'Update rider rating'
            : 'Submit rider rating'}
      </button>
    </div>
  )
}
