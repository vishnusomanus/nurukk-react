import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerProductRating } from '@/api/services/buyerService'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { ProductNutritionPanel } from '@/components/buyer/ProductNutritionPanel'
import { ProductCard } from '@/components/buyer/ProductCard'
import { ProductRateForm } from '@/components/buyer/ProductRateForm'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { triggerCartFly } from '@/store/cartFlyStore'
import { useAddToCart } from '@/hooks/useAddToCart'
import { useAuthStore } from '@/store/authStore'
import { useDeliveryScopeParams, useDeliveryScopeReady } from '@/hooks/useDeliveryScopeParams'
import { extractRows } from '@/utils/extractRows'
import { formatCurrency } from '@/utils/formatCurrency'
import { getProductImage } from '@/utils/productImage'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { navigateAfterFirstCartItem } from '@/utils/cartNavigation'
import { cn } from '@/utils/cn'

function RatingStars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={cn(
            'material-symbols-outlined text-secondary',
            star > value && 'text-outline-variant',
          )}
          style={{
            fontSize: size,
            fontVariationSettings: star <= value ? "'FILL' 1" : undefined,
          }}
        >
          star
        </span>
      ))}
    </span>
  )
}

export function ProductDetailPage() {
  const { productUuid = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const imageRef = useRef<HTMLDivElement>(null)
  const [addedPop, setAddedPop] = useState(false)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const deliveryScope = useDeliveryScopeParams()
  const deliveryScopeReady = useDeliveryScopeReady()

  const { data, isLoading: productLoading, error } = useQuery({
    queryKey: ['buyer', 'product', productUuid, deliveryScope.latitude, deliveryScope.longitude],
    queryFn: () => buyerService.getProduct(productUuid, deliveryScope),
    enabled: deliveryScopeReady && !!productUuid,
  })
  const isLoading = !deliveryScopeReady || productLoading

  const { data: relatedData } = useQuery({
    queryKey: ['buyer', 'product', productUuid, 'related', deliveryScope.latitude, deliveryScope.longitude],
    queryFn: () => buyerService.getRelatedProducts(productUuid, deliveryScope),
    enabled: deliveryScopeReady && !!productUuid,
  })

  const { data: ratingsData, isLoading: ratingsLoading } = useQuery({
    queryKey: ['buyer', 'product', productUuid, 'ratings'],
    queryFn: () => buyerService.listProductRatings(productUuid, { page: 1, per_page: 20 }),
    enabled: !!productUuid,
  })

  const addToCart = useAddToCart()
  const user = useAuthStore((s) => s.user)

  const product = data?.data
  const related = relatedData?.data ?? []
  const ratings = extractRows(ratingsData?.data) as BuyerProductRating[]
  const myRating = useMemo(() => {
    if (product?.my_rating) return product.my_rating
    const userUuid = user?.uuid
    if (!userUuid) return null
    return ratings.find((row) => row.user?.uuid === userUuid) ?? null
  }, [product?.my_rating, ratings, user?.uuid])
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
        <BuyerPageHeader title="Product" backTo="/buyer" />
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
        <BuyerPageHeader title="Product" backTo="/buyer" />
        <p className="app-page-pad-top buyer-page-container text-rose-700 lg:pt-8">
          {getApiErrorMessage(error, 'Product not found')}
        </p>
      </div>
    )
  }

  const lineTotal =
    typeof price === 'number' && Number.isFinite(price) ? price * qty : undefined

  const qtyControl = (
    <div className="flex h-12 shrink-0 items-center rounded-2xl bg-surface-container-high p-1">
      <button
        type="button"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        disabled={qty <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface transition-colors hover:bg-surface disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <span className="material-symbols-outlined text-[20px]">remove</span>
      </button>
      <span className="min-w-8 px-1 text-center text-base font-bold tabular-nums text-on-surface">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => setQty((q) => q + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface transition-colors hover:bg-surface"
        aria-label="Increase quantity"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>
    </div>
  )

  const addLabel = outOfDeliveryRange
    ? 'Outside delivery range'
    : addToCart.isPending
      ? 'Adding…'
      : addedPop
        ? 'Added'
        : 'Add to cart'

  const addToCartBtn = (
    <button
      type="button"
      disabled={addToCart.isPending || product.is_available === false || outOfDeliveryRange}
      onClick={handleAddToCart}
      className={cn(
        'group relative flex h-14 min-w-0 flex-1 items-center justify-between gap-3 overflow-hidden rounded-2xl px-4 text-left transition-[transform,box-shadow,background-color] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55',
        outOfDeliveryRange || product.is_available === false
          ? 'bg-surface-container-high text-on-surface-variant'
          : 'bg-primary text-on-primary shadow-[0_12px_28px_-8px_rgba(13,99,27,0.55)] hover:bg-[#0b5618]',
        addedPop && 'add-to-cart-pop',
      )}
    >
      <span className="relative z-10 flex min-w-0 flex-col">
        <span className="truncate text-[15px] font-bold tracking-tight">{addLabel}</span>
        {lineTotal != null && !outOfDeliveryRange && product.is_available !== false ? (
          <span
            className={cn(
              'text-xs font-medium tabular-nums',
              outOfDeliveryRange ? 'text-on-surface-variant' : 'text-on-primary/80',
            )}
          >
            {formatCurrency(lineTotal)}
            {product.unit ? ` · ${qty} ${product.unit}` : qty > 1 ? ` · qty ${qty}` : null}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          outOfDeliveryRange || product.is_available === false
            ? 'bg-black/5'
            : 'bg-white/15 transition-colors group-hover:bg-white/20',
        )}
      >
        <span
          className={cn(
            'material-symbols-outlined text-[22px]',
            addToCart.isPending && 'animate-spin',
          )}
        >
          {addToCart.isPending ? 'progress_activity' : addedPop ? 'check' : 'shopping_bag'}
        </span>
      </span>
    </button>
  )

  const from = (location.state as { from?: string } | null)?.from
  const productBackTo =
    from ||
    (product.category?.uuid ? `/buyer/categories/${product.category.uuid}` : '/buyer')

  return (
    <div className="app-page-pad-bottom-cta pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      <BuyerPageHeader title={product.name} backTo={productBackTo} />

      {/* Mobile layout */}
      <div className="lg:hidden">
        <section ref={imageRef} className="app-page-pad-top relative h-80 w-full">
          <RemoteImage src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
        </section>
        <article className="relative z-10 -mt-6 rounded-t-[32px] bg-surface px-margin-mobile pt-6 pb-4">
          <ProductInfo product={product} price={price} quantity={qty} mobile />
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
            <ProductInfo product={product} price={price} quantity={qty} />
            <div className="flex items-center gap-3">
              {qtyControl}
              {addToCartBtn}
            </div>
            {addToCart.isError ? (
              <p className="text-sm text-error">{getApiErrorMessage(addToCart.error, 'Failed to add')}</p>
            ) : null}
          </div>
        </div>
      </main>

      <section className="buyer-page-container mt-8 space-y-4 lg:mt-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary" />
            <h2 className="text-lg font-bold text-on-surface">Ratings</h2>
          </div>
          {product.avg_rating != null ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <RatingStars value={Math.round(product.avg_rating)} size={16} />
              <span>{product.avg_rating.toFixed(1)}</span>
              {product.rating_count ? (
                <span className="font-normal text-on-surface-variant">· {product.rating_count}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <ProductRateForm
          productUuid={product.uuid}
          canRate={Boolean(product.can_rate)}
          initialRating={myRating?.rating}
        />

        {ratingsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        ) : ratings.length === 0 ? (
          <p className="rounded-xl bg-surface-container-low px-4 py-5 text-center text-sm text-on-surface-variant">
            No ratings yet. Buy this product to be the first to rate it.
          </p>
        ) : (
          <div className="space-y-2">
            {ratings.map((row, index) => (
              <article
                key={row.uuid ?? `${row.user?.uuid ?? 'anon'}-${index}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3"
              >
                <p className="text-sm font-semibold text-on-surface">
                  {row.user?.name ?? 'Buyer'}
                </p>
                <RatingStars value={row.rating} size={16} />
              </article>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 ? (
        <section className="buyer-page-container mt-8 mb-4 lg:mt-10 lg:mb-0">
          <h2 className="mb-4 text-lg font-bold text-on-surface lg:text-headline-lg">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.uuid}
                product={item}
                layout="grid"
                showFavorite
                className="lg:hidden"
              />
            ))}
            {related.map((item) => (
              <ProductCard
                key={`d-${item.uuid}`}
                product={item}
                layout="desktop"
                showFavorite
                className="hidden lg:block"
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="app-cta-safe fixed bottom-0 left-0 right-0 z-30 border-t border-outline-variant/40 bg-surface/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-margin-mobile py-3">
          {qtyControl}
          {addToCartBtn}
        </div>
        {addToCart.isError ? (
          <p className="px-margin-mobile pb-2 text-center text-sm text-error">
            {getApiErrorMessage(addToCart.error, 'Failed to add')}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function ProductInfo({
  product,
  price,
  quantity,
  mobile,
}: {
  product: NonNullable<Awaited<ReturnType<typeof buyerService.getProduct>>['data']>
  price: number | undefined
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
          {product.avg_rating != null ? (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <RatingStars value={Math.round(product.avg_rating)} size={16} />
              <span className="font-semibold text-on-surface">{product.avg_rating.toFixed(1)}</span>
              {product.rating_count ? <span>({product.rating_count})</span> : null}
            </div>
          ) : null}
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
