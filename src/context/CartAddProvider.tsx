import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { CartData } from '@/api/services/buyerService'
import { ConfirmActionModal } from '@/components/buyer/ConfirmActionModal'
import type { GenericSuccess } from '@/types/api'
import { getCartStoreConflict, type CartStoreConflict } from '@/utils/cartStoreConflict'

export type CartAddPayload = {
  product_uuid: string
  quantity: number
  replace_cart?: boolean
}

type PendingCartAdd = {
  payload: CartAddPayload
  onSuccess?: () => void
}

type CartAddContextValue = {
  addToCart: (payload: CartAddPayload, options?: { onSuccess?: () => void }) => Promise<GenericSuccess<CartData> | null>
  isPending: boolean
  error: unknown
  resetError: () => void
}

const CartAddContext = createContext<CartAddContextValue | null>(null)

export function CartAddProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [conflict, setConflict] = useState<CartStoreConflict | null>(null)
  const pendingRef = useRef<PendingCartAdd | null>(null)

  const mutation = useMutation({
    mutationFn: (input: PendingCartAdd) =>
      buyerService.addCartItem({
        product_uuid: input.payload.product_uuid,
        quantity: input.payload.quantity,
        replace_cart: input.payload.replace_cart,
      }),
    onSuccess: (response, input) => {
      queryClient.setQueryData(['buyer', 'cart'], response)
      input.onSuccess?.()
    },
  })

  const addToCart = useCallback(
    async (payload: CartAddPayload, options?: { onSuccess?: () => void }) => {
      try {
        const response = await mutation.mutateAsync({
          payload,
          onSuccess: options?.onSuccess,
        })
        return response
      } catch (err) {
        const conflictData = getCartStoreConflict(err)
        if (conflictData && !payload.replace_cart) {
          pendingRef.current = { payload, onSuccess: options?.onSuccess }
          setConflict(conflictData)
          return null
        }
        throw err
      }
    },
    [mutation],
  )

  const confirmReplace = useCallback(async () => {
    const pending = pendingRef.current
    if (!pending) return

    setConflict(null)
    pendingRef.current = null

    await addToCart({ ...pending.payload, replace_cart: true }, { onSuccess: pending.onSuccess })
  }, [addToCart])

  const cancelReplace = useCallback(() => {
    pendingRef.current = null
    setConflict(null)
  }, [])

  const value = useMemo(
    () => ({
      addToCart,
      isPending: mutation.isPending,
      error: mutation.error,
      resetError: mutation.reset,
    }),
    [addToCart, mutation.error, mutation.isPending, mutation.reset],
  )

  const currentStoreName = conflict?.currentStore.store_name ?? 'another store'
  const incomingStoreName = conflict?.incomingStore.store_name ?? 'this store'

  return (
    <CartAddContext.Provider value={value}>
      {children}
      <ConfirmActionModal
        open={Boolean(conflict)}
        title="Replace cart?"
        message={`Switch to ${incomingStoreName}?`}
        description={
          conflict?.message ??
          `Your cart has items from ${currentStoreName}. Adding from ${incomingStoreName} will replace your current cart.`
        }
        confirmLabel={mutation.isPending ? 'Replacing…' : 'Replace cart'}
        confirming={mutation.isPending}
        icon="shopping_cart"
        tone="primary"
        onClose={cancelReplace}
        onConfirm={() => {
          void confirmReplace()
        }}
      />
    </CartAddContext.Provider>
  )
}

export function useCartAdd() {
  const context = useContext(CartAddContext)
  if (!context) {
    throw new Error('useCartAdd must be used within CartAddProvider')
  }
  return context
}
