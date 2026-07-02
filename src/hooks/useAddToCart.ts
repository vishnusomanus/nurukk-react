import { useCallback, useState } from 'react'
import { useCartAdd, type CartAddPayload } from '@/context/CartAddProvider'

export function useAddToCart(options?: { onSuccess?: () => void }) {
  const { addToCart, isPending, error, resetError } = useCartAdd()
  const [localError, setLocalError] = useState<unknown>(null)

  const mutateAsync = useCallback(
    async (payload: CartAddPayload) => {
      setLocalError(null)
      try {
        return await addToCart(payload, { onSuccess: options?.onSuccess })
      } catch (err) {
        setLocalError(err)
        throw err
      }
    },
    [addToCart, options?.onSuccess],
  )

  const combinedError = localError ?? error

  return {
    mutateAsync,
    isPending,
    isError: Boolean(combinedError),
    error: combinedError,
    reset: () => {
      setLocalError(null)
      resetError()
    },
  }
}
