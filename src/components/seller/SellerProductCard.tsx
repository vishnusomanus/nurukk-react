import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SellerProduct } from '@/api/services/sellerService'
import * as sellerService from '@/api/services/sellerService'
import { ProductImage } from '@/components/buyer/ProductImage'
import { formatCurrency } from '@/utils/formatCurrency'
import { cn } from '@/utils/cn'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { getProductTags } from '@/utils/productListing'

type SellerProductCardProps = {
  product: SellerProduct
  lowStockThreshold?: number
}

function stockPercent(stock: number, threshold = 50): number {
  const max = Math.max(threshold * 4, stock, 1)
  return Math.min(100, Math.round((stock / max) * 100))
}

export function SellerProductCard({ product, lowStockThreshold = 10 }: SellerProductCardProps) {
  const queryClient = useQueryClient()
  const stock = product.stock ?? 0
  const isLowStock = stock <= lowStockThreshold
  const tagLabel = getProductTags(product)[0]?.label
  const price = product.discount_price ?? product.price

  const toggleAvailability = useMutation({
    mutationFn: (isAvailable: boolean) =>
      sellerService.updateProduct(product.uuid, { is_available: isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] })
    },
  })

  const deleteProduct = useMutation({
    mutationFn: () => sellerService.deleteProduct(product.uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] })
    },
  })

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest stitch-card-shadow transition-all duration-300 hover:shadow-[0px_8px_24px_rgba(46,125,50,0.12)]">
      <div className="relative h-48 overflow-hidden">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 rounded-lg bg-white/90 px-3 py-1 shadow-sm backdrop-blur-sm">
          <span className="text-price-display text-primary">{formatCurrency(price)}</span>
        </div>
        {isLowStock ? (
          <div className="absolute bottom-4 left-4 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-white">
            LOW STOCK
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-body-lg font-bold text-on-surface">{product.name}</h3>
            {tagLabel ? (
              <span className="mt-1 inline-block rounded bg-surface-variant/30 px-2 py-0.5 text-label-md tracking-tighter text-on-surface-variant uppercase">
                {tagLabel}
              </span>
            ) : null}
          </div>
          <div className="flex gap-1">
            <Link
              to={`/seller/products/${product.uuid}/edit`}
              className="material-symbols-outlined rounded-full p-1 text-outline transition-colors hover:bg-primary/5 hover:text-primary"
              aria-label={`Edit ${product.name}`}
            >
              edit
            </Link>
            <button
              type="button"
              className="material-symbols-outlined rounded-full p-1 text-outline transition-colors hover:bg-error/5 hover:text-error"
              aria-label={`Delete ${product.name}`}
              disabled={deleteProduct.isPending}
              onClick={() => {
                if (window.confirm(`Delete ${product.name}?`)) deleteProduct.mutate()
              }}
            >
              delete
            </button>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase">Stock Level</span>
            <span className={cn('text-price-display', isLowStock ? 'text-secondary' : 'text-on-surface')}>
              {stock} {product.unit ? product.unit : 'Units'}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
            <div
              className={cn('h-full rounded-full', isLowStock ? 'bg-secondary' : 'bg-primary')}
              style={{ width: `${stockPercent(stock, lowStockThreshold)}%` }}
            />
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
            <span className="text-label-md text-on-surface-variant">Available</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={product.is_available !== false}
                disabled={toggleAvailability.isPending}
                onChange={(event) => toggleAvailability.mutate(event.target.checked)}
              />
              <div className="peer h-6 w-11 rounded-full bg-surface-variant peer-checked:bg-primary peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          {toggleAvailability.error ? (
            <p className="text-xs text-error">{getApiErrorMessage(toggleAvailability.error, 'Update failed')}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
