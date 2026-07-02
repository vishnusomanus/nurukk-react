import type { NavigateFunction } from 'react-router-dom'
import type { BuyerProduct, CartData } from '@/api/services/buyerService'
import type { GenericSuccess } from '@/types/api'
import { getSellerStorePath } from '@/utils/productNavigation'

export function isFirstCartItem(result: GenericSuccess<CartData> | null): boolean {
  return (result?.data?.items?.length ?? 0) === 1
}

export function resolveStorePathFromCartResult(
  result: GenericSuccess<CartData> | null,
  product?: BuyerProduct,
): string | null {
  const storeUuid = result?.data?.store?.uuid
  if (typeof storeUuid === 'string' && storeUuid) {
    return `/buyer/stores/${storeUuid}`
  }
  return product ? getSellerStorePath(product) : null
}

export function navigateAfterFirstCartItem(
  navigate: NavigateFunction,
  result: GenericSuccess<CartData> | null,
  product?: BuyerProduct,
) {
  if (!isFirstCartItem(result)) return
  const path = resolveStorePathFromCartResult(result, product)
  if (path) navigate(path)
}
