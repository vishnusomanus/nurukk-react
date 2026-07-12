import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { ProductCard } from '@/components/buyer/ProductCard'
import { ProductImage, RemoteImage } from '@/components/buyer/ProductImage'
import { SellerCard } from '@/components/buyer/SellerCard'
import { DeliveryLocationControl } from '@/components/buyer/DeliveryLocationControl'
import { DeliveryRangeBanner } from '@/components/buyer/DeliveryRangeBanner'
import { HomeSearchBar } from '@/components/buyer/HomeSearchBar'
import { HomeOffersSection } from '@/components/buyer/HomeOffersSection'
import { NoStoresNearbyCard } from '@/components/buyer/NoStoresNearbyCard'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { HomeBannerSlider } from '@/components/buyer/HomeBannerSlider'
import { APP_NAME } from '@/constants/app'
import { useDeliveryLocation } from '@/context/DeliveryLocationProvider'
import { useDeliveryScopeParams } from '@/hooks/useDeliveryScopeParams'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { formatCurrency } from '@/utils/formatCurrency'
import type { BuyerCategory } from '@/api/services/buyerService'

function categoryIcon(name?: string) {
  const key = String(name ?? '').toLowerCase()
  if (key.includes('cut')) return 'restaurant'
  if (key.includes('leaf')) return 'energy_savings_leaf'
  if (key.includes('exotic')) return 'star'
  return 'eco'
}

function isCutVegetableCategory(category: BuyerCategory) {
  const key = `${category.slug ?? ''} ${category.name ?? ''}`.toLowerCase()
  return key.includes('cut')
}

export function BuyerHomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const deliveryScope = useDeliveryScopeParams()
  const { stored } = useDeliveryLocation()
  const noStoresInRange = Boolean(stored && !stored.serviceable)

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'home', deliveryScope.latitude, deliveryScope.longitude],
    queryFn: () => buyerService.getHome(deliveryScope),
  })

  const home = data?.data
  const categories = home?.categories ?? []
  const featured = home?.featured_products ?? []
  const featuredSellers = home?.featured_sellers ?? []
  const banners = home?.banners ?? []
  const offers = home?.offers ?? []
  const recent = home?.recently_purchased ?? []
  const cutVegCategory = categories.find(isCutVegetableCategory)

  const { data: cutVegData, isLoading: cutVegLoading } = useQuery({
    queryKey: [
      'buyer',
      'home',
      'cut-vegetables',
      cutVegCategory?.uuid,
      deliveryScope.latitude,
      deliveryScope.longitude,
    ],
    queryFn: () =>
      buyerService.listCategoryProducts(cutVegCategory!.uuid, {
        ...deliveryScope,
        per_page: 12,
      }),
    enabled: !!cutVegCategory?.uuid,
  })
  const cutVegProducts = cutVegData?.data ?? []
  const showCutVegSection = !!cutVegCategory && (cutVegLoading || cutVegProducts.length > 0)

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (q) navigate(`/buyer/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="app-page-pad-bottom lg:pb-8">
      {/* Mobile header */}
      <header className="app-header-safe fixed top-0 left-0 right-0 z-40 w-full bg-surface shadow-sm lg:hidden">
        <div className="mx-auto flex h-14 w-full max-w-lg items-center gap-3 px-3 sm:h-16 sm:px-margin-mobile">
          <div className="min-w-0 flex-1">
            <DeliveryLocationControl variant="mobile" />
          </div>
          <h1 className="shrink-0">
            <span className="sr-only">{APP_NAME}</span>
            <BrandLogo size="sm" className="h-9 w-auto max-w-[72px]" alt={APP_NAME} />
          </h1>
        </div>
      </header>

      <main className="app-page-pad-top buyer-page-container space-y-8 lg:space-y-10 lg:pt-8">
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {getApiErrorMessage(error, 'Failed to load home')}
          </p>
        ) : null}

        {noStoresInRange ? (
          <NoStoresNearbyCard />
        ) : (
          <>
            <HomeSearchBar value={search} onChange={setSearch} onSubmit={onSearch} />

            <DeliveryRangeBanner className="mb-2" />

            <HomeBannerSlider banners={banners} />

            {/* Categories */}
            <section>
          <div className="mb-4 flex items-end justify-between lg:mb-6">
            <h3 className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">Shop by Category</h3>
            <Link to="/buyer/categories" className="text-label-md flex items-center gap-1 font-bold text-primary lg:text-body-lg">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Mobile: icon grid */}
          <div className="grid grid-cols-4 gap-3 text-center lg:hidden">
            {(isLoading ? Array.from({ length: 4 }) : categories.slice(0, 4)).map((cat, i) => {
              const category = cat as BuyerCategory | undefined
              return (
                <Link key={category?.uuid ?? i} to={category ? `/buyer/categories/${category.uuid}` : '/buyer/categories'} className="group">
                  <div className="mb-1 flex aspect-square w-full items-center justify-center rounded-full bg-surface-container-high shadow-sm group-active:scale-90">
                    <span className="material-symbols-outlined text-3xl text-primary">{categoryIcon(category?.name)}</span>
                  </div>
                  <p className="text-[11px] leading-tight font-semibold text-on-surface-variant">{category?.name ?? '…'}</p>
                </Link>
              )
            })}
          </div>

          {/* Desktop: image carousel */}
          <div className="stitch-scrollbar stitch-hide-scrollbar -mx-1 hidden gap-6 overflow-x-auto pb-4 lg:flex">
            {(isLoading ? Array.from({ length: 5 }) : categories).map((cat, i) => {
              const category = cat as BuyerCategory | undefined
              return (
                <Link
                  key={category?.uuid ?? i}
                  to={category ? `/buyer/categories/${category.uuid}` : '#'}
                  className="group w-44 flex-shrink-0 cursor-pointer"
                >
                  <div className="mb-3 aspect-square overflow-hidden rounded-3xl border-2 border-transparent transition-all group-hover:border-primary">
                    {category?.image_url ? (
                      <RemoteImage
                        src={category.image_url}
                        alt={category.name ?? ''}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-container-high">
                        <span className="material-symbols-outlined text-5xl text-primary">{categoryIcon(category?.name)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-body-lg text-center font-bold group-hover:text-primary">{category?.name ?? '…'}</p>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Cut vegetables showcase */}
        {showCutVegSection ? (
          <section>
            <div className="mb-4 flex items-end justify-between lg:mb-6">
              <div>
                <h3 className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">
                  {cutVegCategory?.name ?? 'Cut Vegetables'}
                </h3>
                <p className="text-body-md text-on-surface-variant">Ready-to-cook, freshly cut picks</p>
              </div>
              {cutVegCategory ? (
                <Link
                  to={`/buyer/categories/${cutVegCategory.uuid}`}
                  className="text-label-md flex items-center gap-1 font-bold text-primary lg:text-body-lg"
                >
                  View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              ) : null}
            </div>
            <div className="stitch-hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 scroll-smooth lg:grid lg:snap-none lg:grid-cols-4 lg:gap-6 lg:overflow-visible xl:grid-cols-5">
              {cutVegLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-52 w-[calc((100%-1.5rem)/2.5)] shrink-0 animate-pulse snap-start rounded-xl bg-surface-container lg:h-52 lg:w-auto lg:min-w-0"
                    />
                  ))
                : cutVegProducts.map((product) => (
                    <ProductCard
                      key={product.uuid}
                      product={product}
                      layout="horizontal"
                      showFavorite
                      className="w-[calc((100%-1.5rem)/2.5)] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:hidden"
                    />
                  ))}
              {cutVegLoading
                ? null
                : cutVegProducts.map((product) => (
                    <ProductCard
                      key={`d-${product.uuid}`}
                      product={product}
                      layout="desktop"
                      showFavorite
                      className="hidden lg:block"
                    />
                  ))}
            </div>
          </section>
        ) : null}

        {/* Local farm stores */}
        {isLoading || featuredSellers.length > 0 ? (
          <section>
            <div className="mb-4 flex items-end justify-between lg:mb-6">
              <div>
                <h3 className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">Local Farm Stores</h3>
                <p className="text-body-md text-on-surface-variant">Shop directly from verified producers</p>
              </div>
            </div>
            <div className="stitch-hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 scroll-smooth lg:grid lg:snap-none lg:grid-cols-3 lg:gap-6 lg:overflow-visible xl:grid-cols-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-64 w-[calc((100%-0.75rem)/1.5)] shrink-0 animate-pulse snap-start rounded-xl bg-surface-container lg:h-64 lg:w-auto lg:min-w-0"
                    />
                  ))
                : featuredSellers.map((seller) => (
                    <SellerCard
                      key={seller.uuid}
                      seller={seller}
                      layout="horizontal"
                      className="w-[calc((100%-0.75rem)/1.5)] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:hidden"
                    />
                  ))}
              {isLoading
                ? null
                : featuredSellers.map((seller) => (
                    <SellerCard key={`d-${seller.uuid}`} seller={seller} className="hidden lg:block" />
                  ))}
            </div>
          </section>
        ) : null}

        {/* Featured */}
        <section>
          <div className="mb-4 flex items-end justify-between lg:mb-6">
            <h3 className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">Featured Products</h3>
          </div>
          <div className="stitch-hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 scroll-smooth lg:grid lg:snap-none lg:grid-cols-4 lg:gap-6 lg:overflow-visible xl:grid-cols-5">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-52 w-[calc((100%-1.5rem)/2.5)] shrink-0 animate-pulse snap-start rounded-xl bg-surface-container lg:h-52 lg:w-auto lg:min-w-0"
                  />
                ))
              : featured.map((product) => (
                  <ProductCard
                    key={product.uuid}
                    product={product}
                    layout="horizontal"
                    showFavorite
                    clickAddsToCart
                    className="w-[calc((100%-1.5rem)/2.5)] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:hidden"
                  />
                ))}
            {isLoading
              ? null
              : featured.map((product) => (
                  <ProductCard
                    key={`d-${product.uuid}`}
                    product={product}
                    layout="desktop"
                    showFavorite
                    clickAddsToCart
                    className="hidden lg:block"
                  />
                ))}
          </div>
        </section>

        {/* Recently purchased */}
        {recent.length > 0 ? (
          <section className="lg:rounded-3xl lg:border lg:border-surface-container-highest lg:bg-white lg:p-8 lg:shadow-sm">
            <div className="mb-4 flex items-center justify-between lg:mb-8">
              <h3 className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">Recently Purchased</h3>
              <button type="button" className="text-label-md hidden font-bold text-primary lg:block">
                Reorder All
              </button>
            </div>
            <div className="space-y-3">
              {recent.map((product) => (
                <div
                  key={product.uuid}
                  className="flex items-center gap-4 rounded-xl bg-surface-container-lowest p-3 shadow-sm lg:bg-transparent lg:p-4 lg:shadow-none lg:hover:bg-surface-container-low"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg lg:rounded-xl">
                    <ProductImage product={product} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-body-lg font-bold text-on-surface">{product.name}</h4>
                    <p className="text-body-md text-on-surface-variant lg:hidden">
                      {formatCurrency(product.discount_price ?? product.price)}
                    </p>
                    <p className="hidden text-body-md text-on-surface-variant lg:block">Purchased recently</p>
                  </div>
                  <span className="text-price-display hidden lg:inline">
                    {formatCurrency(product.discount_price ?? product.price)}
                  </span>
                  <Link
                    to={`/buyer/products/${product.uuid}`}
                    className="rounded-lg border border-primary px-4 py-1 text-sm font-bold text-primary lg:rounded-full lg:bg-primary-container lg:px-4 lg:py-1 lg:text-on-primary-container lg:no-underline"
                  >
                    Reorder
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <HomeOffersSection offers={offers} />
          </>
        )}
      </main>
    </div>
  )
}
