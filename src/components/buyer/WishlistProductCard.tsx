import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { BuyerProduct } from '@/api/services/buyerService'
import { ProductFavoriteButton } from '@/components/buyer/ProductFavoriteButton'
import { ProductImage } from '@/components/buyer/ProductImage'
import { useAddToCart } from '@/hooks/useAddToCart'
import { triggerCartFly } from '@/store/cartFlyStore'
import { navigateAfterFirstCartItem } from '@/utils/cartNavigation'
import { formatCurrency } from '@/utils/formatCurrency'
import { getProductImage } from '@/utils/productImage'
import { cn } from '@/utils/cn'

function productTags(product: BuyerProduct): string[] {
  const tags: string[] = []
  if (product.category?.name) tags.push(product.category.name)
  if (product.is_available === false) tags.push('Unavailable')
  return tags.slice(0, 2)
}

export function WishlistProductCard({ product }: { product: BuyerProduct }) {
  const navigate = useNavigate()
  const imageRef = useRef<HTMLDivElement>(null)
  const [addedPop, setAddedPop] = useState(false)
  const addToCart = useAddToCart()

  const price = product.discount_price ?? product.price
  const tags = productTags(product)

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const flyPromise = triggerCartFly(getProductImage(product), imageRef.current)
    try {
      const result = await addToCart.mutateAsync({ product_uuid: product.uuid, quantity: 1 })
      if (result === null) return
      await flyPromise
      setAddedPop(true)
      window.setTimeout(() => setAddedPop(false), 450)
      navigateAfterFirstCartItem(navigate, result, product)
    } catch {
      // surfaced via mutation state if needed
    }
  }

  return (
    <article className="group overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-md">
      <div ref={imageRef} className="relative h-40 lg:h-48">
        <Link to={`/buyer/products/${product.uuid}`} className="block h-full w-full">
          <ProductImage
            product={product}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <ProductFavoriteButton
          productUuid={product.uuid}
          activeTone="primary"
          className="top-3 right-3 h-8 w-8 backdrop-blur"
        />
        <button
          type="button"
          disabled={addToCart.isPending || product.is_available === false}
          onClick={handleAdd}
          className={cn(
            'absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-60',
            addedPop && 'add-to-cart-pop',
          )}
        >
          <span className="material-symbols-outlined">{addedPop ? 'check' : 'add'}</span>
        </button>
      </div>

      <div className="p-4">
        <Link to={`/buyer/products/${product.uuid}`}>
          <h3 className="text-headline-lg-mobile mb-2 font-bold text-on-surface">{product.name}</h3>
        </Link>

        {tags.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-1">
            {tags.map((tag, index) => (
              <span
                key={tag}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                  index === 1
                    ? 'bg-primary-container text-on-primary-container'
                    : 'border border-outline text-on-surface-variant',
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div className="mb-4" />
        )}

        <p className="text-price-display text-on-surface">
          {formatCurrency(price)}
          {product.unit ? <span className="text-body-md font-normal text-on-surface-variant"> / {product.unit}</span> : null}
        </p>
      </div>
    </article>
  )
}
