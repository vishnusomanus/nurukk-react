import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerCategory } from '@/api/services/buyerService'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { DeliveryRangeBanner } from '@/components/buyer/DeliveryRangeBanner'
import {
  SellerStoreCategoryChips,
  SellerStoreSidebar,
} from '@/components/buyer/SellerStoreSidebar'
import { SellerStoreProductCard } from '@/components/buyer/SellerStoreProductCard'
import { useDeliveryScopeParams } from '@/hooks/useDeliveryScopeParams'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

function storeLocationLabel(city?: string, pincode?: string) {
  const parts = [city, pincode].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Local farm'
}

function collectCategories(products: import('@/api/services/buyerService').BuyerProduct[]) {
  const map = new Map<string, BuyerCategory>()
  for (const product of products) {
    const category = product.category
    if (category?.uuid) {
      map.set(category.uuid, category)
    }
  }
  return Array.from(map.values())
}

export function BuyerSellerStorePage() {
  const { sellerUuid } = useParams()
  const deliveryScope = useDeliveryScopeParams()
  const [activeCategoryUuid, setActiveCategoryUuid] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'seller-store', sellerUuid, deliveryScope.latitude, deliveryScope.longitude],
    queryFn: () => buyerService.getSellerStore(sellerUuid!, deliveryScope),
    enabled: Boolean(sellerUuid),
  })

  const store = data?.data?.store
  const products = data?.data?.products ?? []
  const deliverable = data?.data?.deliverable
  const categories = useMemo(() => collectCategories(products), [products])

  const filteredProducts = useMemo(() => {
    if (!activeCategoryUuid) return products
    return products.filter((product) => product.category?.uuid === activeCategoryUuid)
  }, [products, activeCategoryUuid])

  const storeName = store?.store_name?.trim() || 'Farm Store'
  const location = storeLocationLabel(store?.city, store?.pincode)

  return (
    <div className="app-page-pad-bottom lg:pb-8">
      <BuyerPageHeader title={storeName} backTo="/buyer" />

      <main className="app-page-pad-top buyer-page-container space-y-6 lg:space-y-8 lg:pt-8">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-label-md mb-2 tracking-widest text-primary uppercase">Farm Store</p>
              <h1 className="text-headline-xl text-on-surface">{storeName}</h1>
              {store?.description ? (
                <p className="text-body-lg mt-2 max-w-2xl text-on-surface-variant">{store.description}</p>
              ) : null}
              <p className="text-body-md mt-3 flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                {location}
              </p>
            </div>
            {store?.status === 'approved' ? (
              <span className="inline-flex items-center gap-1 self-start rounded-full bg-primary-container px-3 py-1 text-[10px] font-bold tracking-wider text-on-primary-container uppercase">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                Verified
              </span>
            ) : null}
          </div>
        </section>

        <DeliveryRangeBanner />

        {deliverable === false ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-body-md text-amber-950">
            This farm store may not deliver to your current location.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {getApiErrorMessage(error, 'Failed to load store')}
          </p>
        ) : null}

        <div className="flex flex-col gap-8 md:flex-row">
          <SellerStoreSidebar
            categories={categories}
            activeCategoryUuid={activeCategoryUuid}
            onCategoryChange={setActiveCategoryUuid}
            storeName={storeName}
            className="hidden md:block"
          />

          <div className="min-w-0 flex-1">
            <SellerStoreCategoryChips
              categories={categories}
              activeCategoryUuid={activeCategoryUuid}
              onCategoryChange={setActiveCategoryUuid}
            />

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-72 animate-pulse rounded-xl bg-surface-container" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <SellerStoreProductCard key={product.uuid} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-8 text-center">
                <span className="material-symbols-outlined mb-3 text-4xl text-outline">inventory_2</span>
                <p className="text-body-lg text-on-surface-variant">
                  {activeCategoryUuid ? 'No products in this category yet.' : 'This store has no products listed yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
