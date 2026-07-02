import { Link } from 'react-router-dom'
import type { BuyerSellerSummary } from '@/api/services/buyerService'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { cn } from '@/utils/cn'

const STORE_CARD_FALLBACK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDXTNV3O8Jg5ny69aiykmsibvfwc7DDcpikIWI8Pi3s6GBeJjpegqxlZjLX7Zl54Z1VI87hEH_SLw40lTasiDyfDBRy1cPm5_IwntoUjVWUguK64UbijaJmpakE76ByqWP6QEt8RttX-JKOe_WP0ZnHYHbF3iDFIHJbHLarQOlQ9oq99DaTwhicDZl647MkysMXdtIN6lyxwbtdnxYdwA4J-WwVm2B584qkpE_WagjHj0XjSqSWGxsmxwMZU_saRDly8zG1ITd66Zefx'

function storeLocationLabel(city?: string, pincode?: string) {
  const parts = [city, pincode].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Local farm'
}

export function SellerCard({
  seller,
  className,
  layout = 'grid',
}: {
  seller: BuyerSellerSummary
  className?: string
  layout?: 'grid' | 'horizontal'
}) {
  const storeName = seller.store_name?.trim() || 'Farm Store'
  const location = storeLocationLabel(seller.city, seller.pincode)
  const isVerified = seller.status === 'approved'
  const productCount = seller.product_count ?? 0
  const description =
    seller.description?.trim() ||
    (productCount > 0
      ? `${productCount} fresh item${productCount === 1 ? '' : 's'} available`
      : 'Farm-fresh produce')

  if (layout === 'horizontal') {
    return (
      <Link
        to={`/buyer/stores/${seller.uuid}`}
        className={cn(
          'group flex min-w-[260px] shrink-0 flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-0.5',
          className,
        )}
      >
        <div className="relative h-36 overflow-hidden">
          <RemoteImage
            src={seller.image_url ?? STORE_CARD_FALLBACK}
            fallbackSrc={STORE_CARD_FALLBACK}
            alt={storeName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {isVerified ? (
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-[10px] font-bold text-on-primary-container">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              Verified
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h4 className="text-body-lg truncate font-bold text-on-surface">{storeName}</h4>
          <p className="text-body-md mt-1 line-clamp-2 text-on-surface-variant">{description}</p>
          <p className="text-label-md mt-auto flex items-center gap-1 pt-3 text-primary">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            {location}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/buyer/stores/${seller.uuid}`}
      className={cn(
        'group overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1',
        className,
      )}
    >
      <div className="relative h-44 overflow-hidden lg:h-48">
        <RemoteImage
          src={seller.image_url ?? STORE_CARD_FALLBACK}
          fallbackSrc={STORE_CARD_FALLBACK}
          alt={storeName}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {isVerified ? (
          <span className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-[10px] font-bold tracking-wider text-on-primary-container uppercase">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            Verified
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="text-headline-lg-mobile mb-1 text-on-surface">{storeName}</h3>
        <p className="text-body-md mb-3 line-clamp-2 text-on-surface-variant">{description}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-label-md flex min-w-0 items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined shrink-0 text-[16px]">location_on</span>
            <span className="truncate">{location}</span>
          </span>
          {productCount > 0 ? (
            <span className="text-label-md shrink-0 font-bold text-primary">{productCount} items</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
