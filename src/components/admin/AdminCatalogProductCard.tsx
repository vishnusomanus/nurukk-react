import type { BuyerProduct } from '@/api/services/buyerService'
import { ProductImage } from '@/components/buyer/ProductImage'
import { formatCurrency } from '@/utils/formatCurrency'
import { getProductDisplayPrice } from '@/utils/productListing'
import { cn } from '@/utils/cn'

type CatalogFilter = 'all' | 'hidden' | 'available'

type AdminCatalogProductCardProps = {
  product: BuyerProduct
  highlighted?: boolean
}

export function AdminCatalogProductCard({ product, highlighted = false }: AdminCatalogProductCardProps) {
  const sellerName =
    typeof product.seller === 'object' && product.seller?.name
      ? String(product.seller.name)
      : 'Marketplace Seller'
  const isHidden = product.is_available === false
  const price = getProductDisplayPrice(product)

  if (highlighted && isHidden) {
    return (
      <article className="col-span-1 flex overflow-hidden rounded-xl border-2 border-error/20 bg-surface-container-lowest stitch-card-shadow transition-all lg:col-span-2">
        <div className="relative w-1/2 min-h-48">
          <ProductImage product={product} className="h-full w-full object-cover" />
          <div className="absolute top-4 left-4 flex animate-pulse items-center gap-2 rounded-full bg-error px-4 py-1 text-label-md text-on-error">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              report
            </span>
            Hidden Listing
          </div>
        </div>
        <div className="flex w-1/2 flex-col justify-between p-6">
          <div>
            <h3 className="mb-2 text-headline-lg text-on-surface">{product.name}</h3>
            <p className="mb-4 flex items-center gap-2 text-body-md text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">store</span>
              {sellerName}
            </p>
            <p className="text-price-display text-primary">{formatCurrency(price)}</p>
          </div>
          <button type="button" disabled className="mt-4 rounded-lg bg-surface-container-high py-2 text-label-md text-on-surface-variant">
            Restore Listing (seller action)
          </button>
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border bg-surface-container-lowest stitch-card-shadow transition-all',
        isHidden ? 'border-dashed border-outline-variant opacity-75' : 'border-outline-variant/30',
      )}
    >
      <div className={cn('relative h-48', isHidden && 'grayscale')}>
        <ProductImage product={product} className="h-full w-full object-cover" />
        {isHidden ? (
          <div className="absolute inset-0 flex items-center justify-center bg-on-surface/40">
            <span className="flex items-center gap-2 rounded-full bg-surface/90 px-4 py-1 text-label-md text-on-surface">
              <span className="material-symbols-outlined text-[16px]">visibility_off</span>
              Hidden
            </span>
          </div>
        ) : (
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                'rounded-full px-2 py-1 text-[10px] font-bold uppercase',
                product.is_available === false
                  ? 'bg-error-container text-error'
                  : 'bg-primary-container/20 text-primary',
              )}
            >
              {product.is_available === false ? 'Off' : 'Live'}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-body-lg font-bold text-on-surface">{product.name}</h3>
        <p className="mb-3 text-label-md text-on-surface-variant">{sellerName}</p>
        <p className="mb-4 text-price-display text-primary">{formatCurrency(price)}</p>
        {isHidden ? (
          <p className="mt-auto text-label-md text-on-surface-variant">Contact seller to reactivate</p>
        ) : null}
      </div>
    </article>
  )
}

export function filterCatalogProducts(products: BuyerProduct[], filter: CatalogFilter, search: string) {
  const query = search.trim().toLowerCase()

  return products.filter((product) => {
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      String(product.seller?.name ?? '')
        .toLowerCase()
        .includes(query)

    if (!matchesSearch) return false

    if (filter === 'hidden') return product.is_available === false
    if (filter === 'available') return product.is_available !== false
    return true
  })
}

export type { CatalogFilter }
