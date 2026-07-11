import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { ProductNutritionPanel } from '@/components/buyer/ProductNutritionPanel'
import { ProductCard } from '@/components/buyer/ProductCard'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { triggerCartFly } from '@/store/cartFlyStore'
import { useAddToCart } from '@/hooks/useAddToCart'
import { useDeliveryScopeParams } from '@/hooks/useDeliveryScopeParams'
import { formatCurrency } from '@/utils/formatCurrency'
import { getProductImage } from '@/utils/productImage'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { navigateAfterFirstCartItem } from '@/utils/cartNavigation'
import { cn } from '@/utils/cn'

export function ProductDetailPage() {
  const { productUuid = '' } = useParams()
  const navigate = useNavigate()
  const imageRef = useRef<HTMLDivElement>(null)
  const [addedPop, setAddedPop] = useState(false)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const deliveryScope = useDeliveryScopeParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'product', productUuid, deliveryScope.latitude, deliveryScope.longitude],
    queryFn: () => buyerService.getProduct(productUuid, deliveryScope),
    enabled: !!productUuid,
  })

  const { data: relatedData } = useQuery({
    queryKey: ['buyer', 'product', productUuid, 'related', deliveryScope.latitude, deliveryScope.longitude],
    queryFn: () => buyerService.getRelatedProducts(productUuid, deliveryScope),
    enabled: !!productUuid,
  })

  const addToCart = useAddToCart()

  const product = data?.data
  const related = relatedData?.data ?? []
  const price = product?.discount_price ?? product?.price
  const images = product?.images?.length ? product.images : [getProductImage(product)]
  const outOfDeliveryRange = product?.deliverable === false

  const handleAddToCart = async () => {
    if (!product || outOfDeliveryRange) return
    const flyPromise = triggerCartFly(images[activeImage] ?? getProductImage(product), imageRef.current)
    try {
      const result = await addToCart.mutateAsync({ product_uuid: productUuid, quantity: qty })
      if (result === null) return
      await flyPromise
      setAddedPop(true)
      navigateAfterFirstCartItem(navigate, result, product)
    } catch {
      // mutation error surfaced via addToCart.isError
    }
  }

  if (isLoading) {
    return (
      <div className="app-page-pad-bottom-cta lg:pb-8">
        <BuyerPageHeader title="Product" />
        <div className="app-page-pad-top buyer-page-container animate-pulse space-y-4 lg:pt-8">
          <div className="h-72 rounded-xl bg-surface-container lg:aspect-square lg:h-auto" />
          <div className="h-8 w-2/3 rounded bg-surface-container" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="app-page-pad-bottom-cta lg:pb-8">
        <BuyerPageHeader title="Product" />
        <p className="app-page-pad-top buyer-page-container text-rose-700 lg:pt-8">
          {getApiErrorMessage(error, 'Product not found')}
        </p>
      </div>
    )
  }

  const qtyControl = (
    <div className="flex items-center rounded-full border border-outline-variant bg-surface-container-high px-1 py-1">
      <button
        type="button"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface"
      >
        <span className="material-symbols-outlined">remove</span>
      </button>
      <span className="min-w-[50px] px-4 text-center text-body-lg font-bold">{qty}</span>
      <button
        type="button"
        onClick={() => setQty((q) => q + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  )

  const addToCartBtn = (
    <button
      type="button"
      disabled={addToCart.isPending || product.is_available === false || outOfDeliveryRange}
      onClick={handleAddToCart}
      className={cn(
        'flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-on-primary shadow-[0px_8px_24px_rgba(46,125,50,0.12)] transition-all hover:bg-primary-container active:scale-[0.98] disabled:opacity-60 lg:rounded-xl',
        addedPop && 'add-to-cart-pop',
      )}
    >
      {outOfDeliveryRange
        ? 'Outside delivery range'
        : addToCart.isPending
          ? 'Adding…'
          : addedPop
            ? 'Added!'
            : 'Add to Cart'}
      <span className="material-symbols-outlined">{addedPop ? 'check' : 'shopping_cart'}</span>
    </button>
  )

  return (
    <div className="app-page-pad-bottom-cta lg:pb-8">
      <BuyerPageHeader title={product.name} />

      {/* Mobile layout */}
      <div className="lg:hidden">
        <section ref={imageRef} className="app-page-pad-top relative h-80 w-full">
          <RemoteImage src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
        </section>
        <article className="relative z-10 -mt-6 rounded-t-[32px] bg-surface px-margin-mobile pt-6">
          <ProductInfo product={product} price={price} qtyControl={qtyControl} quantity={qty} mobile />
        </article>
      </div>

      {/* Desktop layout */}
      <main className="buyer-page-container hidden pt-8 lg:block">
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 xl:gap-12">
          <div className="space-y-4">
            <div
              ref={imageRef}
              className="relative aspect-square overflow-hidden rounded-xl border border-surface-container-highest bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.05)]"
            >
              <RemoteImage src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-label-md text-white shadow-sm">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  100% Organic
                </span>
              </div>
            </div>
            {images.length > 1 ? (
              <div className="stitch-hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                      activeImage === i ? 'border-primary' : 'border-transparent hover:border-outline-variant',
                    )}
                  >
                    <RemoteImage src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-secondary-fixed px-3 py-1 text-label-md text-on-secondary-fixed">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
              Fastest Delivery: 30 mins
            </span>
            <ProductInfo product={product} price={price} qtyControl={qtyControl} quantity={qty} />
            <div className="flex flex-wrap items-center gap-4">
              {qtyControl}
              {addToCartBtn}
            </div>
            {addToCart.isError ? (
              <p className="text-sm text-error">{getApiErrorMessage(addToCart.error, 'Failed to add')}</p>
            ) : null}
          </div>
        </div>
      </main>

      {related.length > 0 ? (
        <section className="buyer-page-container mt-10 hidden lg:block">
          <h2 className="text-headline-lg mb-4 text-on-surface">You may also like</h2>
          <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.uuid} product={item} layout="desktop" showFavorite clickAddsToCart />
            ))}
          </div>
        </section>
      ) : null}

      <div className="app-cta-safe fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-lg px-margin-mobile pt-3 lg:hidden">
        {addToCartBtn}
        {addToCart.isError ? (
          <p className="mt-2 text-center text-sm text-error">{getApiErrorMessage(addToCart.error, 'Failed to add')}</p>
        ) : null}
      </div>
    </div>
  )
}

function ProductInfo({
  product,
  price,
  qtyControl,
  quantity,
  mobile,
}: {
  product: NonNullable<Awaited<ReturnType<typeof buyerService.getProduct>>['data']>
  price: number | undefined
  qtyControl: React.ReactNode
  quantity: number
  mobile?: boolean
}) {
  return (
    <>
      <div className={cn('mb-6 flex items-start justify-between', !mobile && 'mb-0')}>
        <div className="space-y-1">
          {mobile ? (
            <span className="text-label-md inline-flex items-center rounded-full bg-primary-container/10 px-3 py-1 text-primary">
              Organic Farm Fresh
            </span>
          ) : null}
          <h1 className="text-headline-xl tracking-tight text-on-surface">{product.name}</h1>
          <div className="flex items-center gap-2">
            <span className={cn('text-price-display text-primary', !mobile && 'text-[32px]')}>
              {formatCurrency(price)}
            </span>
            {product.unit ? <span className="text-body-lg text-on-surface-variant">/ {product.unit}</span> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <span className="text-label-md">{product.is_available !== false ? 'In Stock' : 'Out of stock'}</span>
          </div>
        </div>
      </div>

      {mobile ? (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <p className="text-label-md tracking-wider text-on-surface-variant uppercase">Fastest Delivery</p>
            <p className="text-body-lg font-bold text-on-surface">Deliver in 30 mins</p>
          </div>
        </div>
      ) : (
        <div className="h-px w-full bg-outline-variant/30" />
      )}

      {product.description ? (
        <section className={mobile ? 'mb-8' : ''}>
          <h2 className="text-headline-lg-mobile mb-2 lg:text-headline-lg">Product Details</h2>
          <p className="text-body-lg leading-relaxed text-on-surface-variant">{product.description}</p>
        </section>
      ) : null}

      <ProductNutritionPanel
        nutrition={product.nutrition}
        quantity={quantity}
        className={mobile ? 'mb-8' : 'mt-2'}
      />

      {mobile ? (
        <div className="mb-4 flex items-center justify-center gap-4">{qtyControl}</div>
      ) : null}

      <ProductSellerLink seller={product.seller} className={mobile ? 'mb-6' : 'mt-6'} />
    </>
  )
}

function ProductSellerLink({
  seller,
  className,
}: {
  seller?: NonNullable<Awaited<ReturnType<typeof buyerService.getProduct>>['data']>['seller']
  className?: string
}) {
  if (!seller?.uuid) return null

  const storeName = seller.store_name ?? seller.name ?? 'Farm Store'
  const location = seller.city?.trim()

  return (
    <Link
      to={`/buyer/stores/${seller.uuid}`}
      className={cn(
        'flex flex-col justify-between rounded-xl bg-secondary-fixed p-6 text-on-secondary-fixed transition-transform hover:-translate-y-0.5 active:scale-[0.99]',
        className,
      )}
    >
      <div>
        <h3 className="text-headline-lg mb-2">Farm Tracker</h3>
        <p className="text-body-md">
          Sourced from {storeName}
          {location ? `, ${location}` : ''}. Shop more from this farm store.
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-body-lg font-bold">View Farm Profile</span>
        <span className="material-symbols-outlined">arrow_forward</span>
      </div>
    </Link>
  )
}
