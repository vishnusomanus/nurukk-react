import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BuyerProduct } from '@/api/services/buyerService'
import { ProductImage } from '@/components/buyer/ProductImage'
import { useAddToCart } from '@/hooks/useAddToCart'
import { triggerCartFly } from '@/store/cartFlyStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { getProductImage } from '@/utils/productImage'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import {
  getProductListingBadge,
  getProductListingBadgeClassName,
} from '@/utils/productListing'
import { cn } from '@/utils/cn'

export function SellerStoreProductCard({ product }: { product: BuyerProduct }) {
  const imageRef = useRef<HTMLDivElement>(null)
  const [addedPop, setAddedPop] = useState(false)
  const addToCart = useAddToCart()

  const price = product.discount_price ?? product.price
  const badge = getProductListingBadge(product)
  const outOfStock = product.is_available === false

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return

    const flyPromise = triggerCartFly(getProductImage(product), imageRef.current)
    try {
      const result = await addToCart.mutateAsync({ product_uuid: product.uuid, quantity: 1 })
      if (result === null) return
      await flyPromise
      setAddedPop(true)
      window.setTimeout(() => setAddedPop(false), 450)
    } catch {
      // surfaced via addToCart.isError
    }
  }

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1',
        outOfStock && 'opacity-75 grayscale-[0.5]',
      )}
    >
      <Link to={`/buyer/products/${product.uuid}`} className="block">
        <div ref={imageRef} className="relative aspect-square overflow-hidden sm:h-48 sm:aspect-auto">
          <ProductImage
            product={product}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {badge && !outOfStock ? (
            <div
              className={cn(
                'pointer-events-none absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase sm:top-3 sm:left-3 sm:px-3 sm:py-1 sm:text-[10px]',
                getProductListingBadgeClassName(badge),
              )}
            >
              {badge.label}
            </div>
          ) : null}
          {outOfStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <span className="rounded-lg bg-surface px-2 py-1 text-[10px] font-bold tracking-widest text-on-surface uppercase shadow-xl sm:px-4 sm:py-2 sm:text-label-md">
                Out of Stock
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="p-2.5 sm:p-4">
        <Link to={`/buyer/products/${product.uuid}`}>
          <h3 className="mb-0.5 line-clamp-2 text-sm font-bold text-on-surface sm:mb-1 sm:text-base">
            {product.name}
          </h3>
          <p className="text-label-md mb-2 text-on-surface-variant sm:mb-4">{product.unit ?? 'Fresh pack'}</p>
        </Link>
        <div className="flex items-center justify-between gap-1">
          <span className={cn('text-base font-bold text-primary sm:text-price-display', outOfStock && 'text-outline')}>
            {formatCurrency(price)}
          </span>
          {outOfStock ? (
            <button
              type="button"
              disabled
              className="flex h-8 w-8 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-outline-variant text-white sm:h-10 sm:w-10"
              aria-label="Notify when available"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[24px]">notifications</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={addToCart.isPending}
              onClick={handleAdd}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all hover:bg-primary-container active:scale-90 disabled:opacity-70 sm:h-10 sm:w-10',
                addedPop && 'add-to-cart-pop',
              )}
              aria-label={`Add ${product.name} to cart`}
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[24px]">
                {addedPop ? 'check' : 'add'}
              </span>
            </button>
          )}
        </div>
        {addToCart.isError ? (
          <p className="mt-2 text-xs text-error">{getApiErrorMessage(addToCart.error, 'Could not add')}</p>
        ) : null}
      </div>
    </article>
  )
}
