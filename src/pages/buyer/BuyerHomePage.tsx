import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { ProductCard } from '@/components/buyer/ProductCard'
import { ProductImage, RemoteImage } from '@/components/buyer/ProductImage'
import { SellerCard } from '@/components/buyer/SellerCard'
import { DeliveryLocationControl } from '@/components/buyer/DeliveryLocationControl'
import { DeliveryRangeBanner } from '@/components/buyer/DeliveryRangeBanner'
import { APP_NAME } from '@/constants/app'
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

const HERO_BANNER_FALLBACK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAlKAjSPa3Vr19krHpQyL0ntY3nqSvgTR7A6opdEno-izRftv-6otpX1-4ndZEJ0PaLzqrf_XQ4RUursLpPLkszrTzYEUU_A_17T4PGIW4QU_LJtWkwGK9IMfDk8zE4QTZGLlNLMgtCSbrdL36lycJPzwxq_OwtVGb42Dhq9LFlcR-Y9X7L4kMYHIvhxOFYhC2lFCndU9FX1D5bNXBYC-_8dv8byyV3gQRzEmz4BwWx7sGQB8H2XOsnWkwD4XF9IAetg29qxjzsy51b'

export function BuyerHomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const deliveryScope = useDeliveryScopeParams()

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

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (q) navigate(`/buyer/search?q=${encodeURIComponent(q)}`)
  }

  const heroImage = banners[0]?.image_url?.trim() || HERO_BANNER_FALLBACK

  return (
    <div className="pb-24 lg:pb-8">
      {/* Mobile header */}
      <header className="fixed top-0 z-40 flex h-16 w-full max-w-lg items-center justify-between bg-surface px-margin-mobile shadow-sm lg:hidden">
        <DeliveryLocationControl variant="mobile" />
        <h1 className="text-headline-lg-mobile font-bold text-primary">{APP_NAME}</h1>
        <button type="button" className="rounded-full p-2 hover:bg-surface-container-low">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
        </button>
      </header>

      <main className="buyer-page-container space-y-8 pt-20 lg:space-y-10 lg:pt-8">
        {/* Search - mobile only inline; desktop in header */}
        <form className="lg:hidden" onSubmit={onSearch}>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-outline">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-body-md h-12 w-full rounded-full border-none bg-surface-container-low pr-4 pl-12 placeholder:text-outline focus:ring-2 focus:ring-primary-container"
              placeholder="Search for fresh vegetables..."
            />
          </div>
        </form>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {getApiErrorMessage(error, 'Failed to load home')}
          </p>
        ) : null}

        <DeliveryRangeBanner className="mb-2" />

        {/* Hero */}
        <section className="relative aspect-[21/9] min-h-48 overflow-hidden rounded-xl shadow-sm md:aspect-[25/8] lg:rounded-3xl">
          <RemoteImage
            priority
            src={heroImage}
            fallbackSrc={HERO_BANNER_FALLBACK}
            alt={banners[0]?.title ?? 'Fresh Morning Deals'}
            className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div className="relative z-20 flex h-full max-w-2xl flex-col justify-center px-6 text-white lg:px-12 xl:px-32">
            <span className="text-label-md mb-2 inline-block self-start rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container">
              EXCLUSIVE OFFERS
            </span>
            <h2 className="text-headline-xl mb-2">{banners[0]?.title ?? 'Fresh Morning Deals'}</h2>
            <p className="text-body-lg mb-4 opacity-90 lg:mb-6">
              Start your day with nutrients harvested at dawn. Up to 30% off on leafy greens.
            </p>
            <div className="hidden gap-4 lg:flex">
              <Link to="/buyer/categories" className="rounded-2xl bg-primary px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-primary-container">
                Shop Deals
              </Link>
              <Link to="/buyer/categories" className="rounded-2xl border border-white/40 bg-white/20 px-8 py-3 font-bold text-white backdrop-blur-md">
                Explore Boxes
              </Link>
            </div>
          </div>
        </section>

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

        {/* Local farm stores */}
        {isLoading || featuredSellers.length > 0 ? (
          <section>
            <div className="mb-4 flex items-end justify-between lg:mb-6">
              <div>
                <h3 className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">Local Farm Stores</h3>
                <p className="text-body-md text-on-surface-variant">Shop directly from verified producers</p>
              </div>
            </div>
            <div className="stitch-hide-scrollbar -mx-margin-mobile flex gap-4 overflow-x-auto px-margin-mobile pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 xl:grid-cols-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="min-w-[260px] h-64 animate-pulse rounded-xl bg-surface-container lg:min-w-0"
                    />
                  ))
                : featuredSellers.map((seller) => (
                    <SellerCard
                      key={seller.uuid}
                      seller={seller}
                      layout="horizontal"
                      className="lg:min-w-0 lg:hidden"
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
          <div className="stitch-hide-scrollbar -mx-margin-mobile flex gap-4 overflow-x-auto px-margin-mobile pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0 xl:grid-cols-5">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="min-w-[160px] h-52 animate-pulse rounded-xl bg-surface-container lg:min-w-0" />
                ))
              : featured.map((product) => (
                  <ProductCard
                    key={product.uuid}
                    product={product}
                    layout="horizontal"
                    showFavorite
                    clickAddsToCart
                    className="lg:min-w-0 lg:hidden"
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

        {/* Recently purchased + Active offers */}
        {recent.length > 0 || offers.length > 0 ? (
          <section className="space-y-8 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
            {recent.length > 0 ? (
              <div
                className={
                  offers.length > 0
                    ? 'lg:col-span-2 lg:rounded-3xl lg:border lg:border-surface-container-highest lg:bg-white lg:p-8 lg:shadow-sm'
                    : 'lg:col-span-3 lg:rounded-3xl lg:border lg:border-surface-container-highest lg:bg-white lg:p-8 lg:shadow-sm'
                }
              >
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
              </div>
            ) : null}

            {offers.length > 0 ? (
              <div
                className={
                  recent.length > 0
                    ? 'lg:col-span-1 lg:flex lg:flex-col lg:rounded-3xl lg:border lg:border-primary/10 lg:bg-primary-container/20 lg:p-8'
                    : 'lg:col-span-3'
                }
              >
                <div className="mb-4 lg:mb-6">
                  <h3 className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">Active Offers</h3>
                </div>
                <div className="space-y-3 lg:flex-1">
                  {offers.map((offer, index) => (
                    <div
                      key={`${offer.code ?? offer.title ?? index}`}
                      className="rounded-xl border border-secondary/20 bg-secondary-container/30 p-4 lg:bg-white/60"
                    >
                      <p className="text-headline-lg-mobile text-on-surface">{offer.title ?? 'Special offer'}</p>
                      {offer.code ? (
                        <p className="text-label-md mt-2 font-bold tracking-wider text-primary uppercase">
                          Code: {offer.code}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  )
}
