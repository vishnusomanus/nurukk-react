import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { BuyerProduct } from '@/api/services/buyerService'
import { ProductImage } from '@/components/buyer/ProductImage'
import { ProductFavoriteButton } from '@/components/buyer/ProductFavoriteButton'
import { useAddToCart } from '@/hooks/useAddToCart'
import { triggerCartFly } from '@/store/cartFlyStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { getProductImage } from '@/utils/productImage'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { getProductListingBadge, getProductListingBadgeClassName } from '@/utils/productListing'
import { getProductDetailPath } from '@/utils/productNavigation'
import { navigateAfterFirstCartItem } from '@/utils/cartNavigation'
import { cn } from '@/utils/cn'

export function ProductCard({
  product,
  className,
  layout = 'horizontal',
  showFavorite = false,
  clickAddsToCart = false,
}: {
  product: BuyerProduct
  className?: string
  layout?: 'horizontal' | 'grid' | 'desktop' | 'uniform'
  showFavorite?: boolean
  /** Grid flow: card click adds one item; first cart item navigates to the seller store. */
  clickAddsToCart?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const imageRef = useRef<HTMLDivElement>(null)
  const [addedPop, setAddedPop] = useState(false)
  const addToCart = useAddToCart()

  const price = product.discount_price ?? product.price
  const original = product.discount_price ? product.price : null
  const productPath = getProductDetailPath(product.uuid)
  const productLinkState = { from: `${location.pathname}${location.search}` }

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
      // mutation error surfaced via addToCart.isError
    }
  }

  const handleCardClick = async () => {
    if (!clickAddsToCart || addToCart.isPending || product.is_available === false) return
    try {
      const result = await addToCart.mutateAsync({ product_uuid: product.uuid, quantity: 1 })
      if (result === null) return
      navigateAfterFirstCartItem(navigate, result, product)
    } catch {
      // mutation error surfaced via addToCart.isError
    }
  }

  const cardClickProps = clickAddsToCart
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: handleCardClick,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            void handleCardClick()
          }
        },
        'aria-disabled': addToCart.isPending || product.is_available === false,
      }
    : {}

  const ProductLink = ({
    children,
    className: linkClassName,
    block = false,
  }: {
    children: React.ReactNode
    className?: string
    block?: boolean
  }) => {
    if (clickAddsToCart) {
      return <div className={cn(block && 'block w-full text-left', linkClassName)}>{children}</div>
    }
    return (
      <Link to={productPath} state={productLinkState} className={cn(block && 'block', linkClassName)}>
        {children}
      </Link>
    )
  }

  const addBtn = (size: 'default' | 'large' = 'default') => (
    <button
      type="button"
      disabled={addToCart.isPending || product.is_available === false}
      onClick={handleAdd}
      className={cn(
        'absolute flex items-center justify-center rounded-full bg-secondary-container text-on-secondary-container transition-transform disabled:opacity-70',
        size === 'large'
          ? 'right-4 bottom-4 h-12 w-12 shadow-[0px_8px_24px_rgba(46,125,50,0.12)] active:scale-90'
          : 'right-2 bottom-2 h-10 w-10 shadow-lg active:scale-95 lg:p-3',
        addedPop && 'add-to-cart-pop',
      )}
    >
      <span className={cn('material-symbols-outlined', size === 'large' && 'text-[28px]')}>
        {addedPop ? 'check' : 'add'}
      </span>
    </button>
  )

  const imageArea = (
    imgClassName: string,
    wrapClassName: string,
    options?: { fabSize?: 'default' | 'large'; favoriteClassName?: string },
  ) => (
    <div ref={imageRef} className={cn('relative', wrapClassName)}>
      <ProductImage product={product} className={imgClassName} />
      {showFavorite ? (
        <ProductFavoriteButton
          productUuid={product.uuid}
          activeTone="primary"
          className={cn(
            'bg-white/80 text-secondary backdrop-blur hover:bg-white',
            options?.favoriteClassName,
          )}
        />
      ) : null}
      {addBtn(options?.fabSize ?? 'default')}
    </div>
  )

  if (layout === 'uniform') {
    const badge = getProductListingBadge(product)
    const description =
      product.description?.trim() ||
      (product.unit ? `Fresh ${product.unit.toLowerCase()}` : 'Locally grown, farm fresh')

    return (
      <div
        {...cardClickProps}
        className={cn(
          'group relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1',
          clickAddsToCart && 'cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-60',
          className,
        )}
      >
        <ProductLink block>
          <div className="relative h-64 overflow-hidden">
            {imageArea(
              'h-full w-full object-cover transition-transform duration-500 group-hover:scale-110',
              'h-full w-full',
              { fabSize: 'large', favoriteClassName: 'top-4 right-4' },
            )}
            {badge ? (
              <div
                className={cn(
                  'pointer-events-none absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] tracking-wider uppercase',
                  getProductListingBadgeClassName(badge),
                )}
              >
                {badge.label}
              </div>
            ) : null}
          </div>
          <div className="p-4">
            <h3 className="text-headline-lg-mobile mb-1 text-on-surface">{product.name}</h3>
            <p className="text-body-md mb-4 line-clamp-2 text-on-surface-variant">{description}</p>
            <div className="flex items-center justify-between">
              <span className="text-price-display text-primary">
                {formatCurrency(price)}
                {product.unit ? (
                  <span className="text-body-md font-normal text-on-surface-variant">
                    {' '}
                    / {product.unit}
                  </span>
                ) : null}
              </span>
              {original ? (
                <span className="text-label-md text-outline line-through">{formatCurrency(original)}</span>
              ) : null}
            </div>
          </div>
        </ProductLink>
        {addToCart.isError ? (
          <p className="px-4 pb-3 text-xs text-error">
            {getApiErrorMessage(addToCart.error, 'Could not add')}
          </p>
        ) : null}
      </div>
    )
  }

  if (layout === 'desktop') {
    return (
      <div
        {...cardClickProps}
        className={cn(
          'group overflow-hidden rounded-3xl border border-surface-container bg-surface text-left shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all hover:shadow-lg',
          clickAddsToCart && 'cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-60',
          className,
        )}
      >
        <ProductLink block className="block h-48 overflow-hidden">
          {imageArea(
            'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
            'h-full w-full',
          )}
        </ProductLink>
        <div className="p-4">
          <p className="text-label-md mb-0.5 tracking-wider text-on-surface-variant uppercase">
            {product.category?.name ?? 'Fresh'}
          </p>
          <ProductLink>
            <h3 className="text-body-lg mb-1 font-bold">{product.name}</h3>
            <p className="text-body-md mb-4 text-on-surface-variant">{product.unit ?? 'Fresh'}</p>
          </ProductLink>
          <div className="flex items-center justify-between">
            <span className="text-price-display text-primary">{formatCurrency(price)}</span>
            {original ? <span className="text-label-md text-outline line-through">{formatCurrency(original)}</span> : null}
          </div>
        </div>
        {clickAddsToCart && addToCart.isError ? (
          <p className="px-4 pb-3 text-xs text-error">{getApiErrorMessage(addToCart.error, 'Could not add')}</p>
        ) : null}
      </div>
    )
  }

  if (layout === 'grid') {
    return (
      <div
        {...cardClickProps}
        className={cn(
          'group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest text-left shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0px_8px_24px_rgba(46,125,50,0.12)] lg:rounded-xl',
          clickAddsToCart && 'cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-60',
          className,
        )}
      >
        <ProductLink block className="block h-32 w-full overflow-hidden sm:h-40 lg:h-48">
          {imageArea(
            'h-full w-full object-cover transition-transform duration-500 group-hover:scale-110',
            'h-full w-full',
          )}
        </ProductLink>
        <div className="flex flex-1 flex-col p-2.5 sm:p-3 lg:p-4">
          <ProductLink>
            <h4 className="truncate text-sm font-bold text-on-surface sm:text-base">{product.name}</h4>
            <p className="truncate text-xs text-on-surface-variant sm:text-sm">{product.unit ?? 'Fresh'}</p>
          </ProductLink>
          <p className="text-price-display mt-auto pt-1.5 text-sm text-primary sm:pt-2 sm:text-base">
            {formatCurrency(price)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      {...cardClickProps}
      className={cn(
        'min-w-0 overflow-hidden rounded-xl bg-white text-left shadow-[0px_4px_20px_rgba(0,0,0,0.05)]',
        clickAddsToCart && 'cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-60',
        className,
      )}
    >
      <ProductLink block className="block h-32 w-full">
        {imageArea('h-full w-full object-cover', 'h-32 w-full')}
      </ProductLink>
      <div className="p-3">
        <ProductLink>
          <h4 className="truncate text-sm font-bold text-on-surface">{product.name}</h4>
          <p className="mb-2 text-xs text-outline">{product.unit ?? 'Fresh'}</p>
        </ProductLink>
        <p className="text-price-display text-primary">{formatCurrency(price)}</p>
        {(clickAddsToCart || addToCart.isError) && addToCart.isError ? (
          <p className="mt-1 text-xs text-error">{getApiErrorMessage(addToCart.error, 'Could not add')}</p>
        ) : null}
      </div>
    </div>
  )
}
