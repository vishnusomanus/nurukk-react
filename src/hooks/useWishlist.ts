import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerProduct } from '@/api/services/buyerService'
import type { GenericSuccess } from '@/types/api'
import { useAuthStore } from '@/store/authStore'
import { extractRows } from '@/utils/extractRows'

const WISHLIST_KEY = ['buyer', 'wishlist'] as const

function normalizeWishlistProducts(data: unknown): BuyerProduct[] {
  if (Array.isArray(data)) return data as BuyerProduct[]
  return extractRows(data) as BuyerProduct[]
}

export function useWishlist() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: () => buyerService.listWishlist(),
    enabled: !!token,
    staleTime: 60_000,
  })

  const productUuids = useMemo(() => {
    const products = normalizeWishlistProducts(query.data?.data)
    return new Set(products.map((p) => p.uuid).filter(Boolean))
  }, [query.data?.data])

  const toggleMutation = useMutation({
    mutationFn: (productUuid: string) => buyerService.toggleWishlist(productUuid),
    onMutate: async (productUuid) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEY })
      const previous = queryClient.getQueryData<GenericSuccess<BuyerProduct[]>>(WISHLIST_KEY)
      const prevProducts = normalizeWishlistProducts(previous?.data)
      const wasWishlisted = prevProducts.some((p) => p.uuid === productUuid)
      const nextProducts = wasWishlisted
        ? prevProducts.filter((p) => p.uuid !== productUuid)
        : [...prevProducts, { uuid: productUuid } as BuyerProduct]

      queryClient.setQueryData<GenericSuccess<BuyerProduct[]>>(WISHLIST_KEY, {
        ...(previous ?? { status: true, message: '' }),
        data: nextProducts,
      })

      return { previous }
    },
    onError: (_err, _uuid, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WISHLIST_KEY, context.previous)
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData(WISHLIST_KEY, response)
    },
  })

  const isWishlisted = useCallback(
    (productUuid: string) => productUuids.has(productUuid),
    [productUuids],
  )

  return {
    isWishlisted,
    toggle: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    isLoading: query.isLoading,
  }
}
