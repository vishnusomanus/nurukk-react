import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as buyerRecipesService from '@/api/services/buyerRecipesService'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

export function RecipeRateForm({
  recipeUuid,
  canRate = false,
  initialRating,
  initialComment,
  onRated,
}: {
  recipeUuid: string
  canRate?: boolean
  initialRating?: number | null
  initialComment?: string | null
  onRated?: () => void
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
      buyerRecipesService.rateRecipe(recipeUuid, {
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      setSubmitted(true)
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'recipe', recipeUuid] })
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'recipe', recipeUuid, 'ratings'] })
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'recipes'] })
      onRated?.()
    },
  })

  if (!canRate && !initialRating) {
    return (
      <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] sm:p-5">
        <h3 className="text-[15px] font-bold text-on-surface lg:text-base">Rate this recipe</h3>
        <p className="mt-2 text-sm text-on-surface-variant">
          Purchase and receive all recipe ingredients to leave a rating.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] sm:p-5">
      <h3 className="text-[15px] font-bold text-on-surface lg:text-base">
        {initialRating ? 'Update your rating' : 'Rate this recipe'}
      </h3>
      <p className="mt-1 mb-4 text-sm text-on-surface-variant">
        Help others with your cooking experience.
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
            disabled={!canRate}
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
        placeholder="Optional feedback…"
        disabled={!canRate}
        className="mb-3 w-full rounded-xl border-none bg-surface-container-low px-3 py-2.5 text-[16px] text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary/20 disabled:opacity-60 lg:text-sm"
      />

      {!canRate ? (
        <p className="mb-2 text-sm text-on-surface-variant">
          Purchase and receive all recipe ingredients to update your rating.
        </p>
      ) : null}

      {rateMutation.isError ? (
        <p className="mb-2 text-sm text-error">
          {getApiErrorMessage(rateMutation.error, 'Could not submit rating')}
        </p>
      ) : null}
      {submitted && !rateMutation.isError ? (
        <p className="mb-2 text-sm font-semibold text-primary">Thanks — your rating was saved.</p>
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
