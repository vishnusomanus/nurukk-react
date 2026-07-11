import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { cn } from '@/utils/cn'

export type HomeBanner = {
  title?: string
  image_url?: string
  link?: string
  subtitle?: string
}

const FALLBACK_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAlKAjSPa3Vr19krHpQyL0ntY3nqSvgTR7A6opdEno-izRftv-6otpX1-4ndZEJ0PaLzqrf_XQ4RUursLpPLkszrTzYEUU_A_17T4PGIW4QU_LJtWkwGK9IMfDk8zE4QTZGLlNLMgtCSbrdL36lycJPzwxq_OwtVGb42Dhq9LFlcR-Y9X7L4kMYHIvhxOFYhC2lFCndU9FX1D5bNXBYC-_8dv8byyV3gQRzEmz4BwWx7sGQB8H2XOsnWkwD4XF9IAetg29qxjzsy51b'

const FALLBACK_BANNERS: HomeBanner[] = [
  {
    title: 'Fresh Morning Deals',
    subtitle: 'Up to 30% off on leafy greens harvested at dawn.',
    image_url: FALLBACK_IMAGE,
    link: '/buyer/categories',
  },
]

function resolveBanners(banners: HomeBanner[]): HomeBanner[] {
  const cleaned = banners
    .map((banner) => ({
      ...banner,
      image_url: banner.image_url?.trim() || undefined,
      title: banner.title?.trim() || undefined,
      link: banner.link?.trim() || undefined,
    }))
    .filter((banner) => banner.image_url || banner.title)

  return cleaned.length > 0 ? cleaned : FALLBACK_BANNERS
}

function bannerHref(link?: string) {
  if (!link) return '/buyer/categories'
  if (link.startsWith('http://') || link.startsWith('https://')) return link
  if (link.startsWith('/')) return link
  return `/buyer/categories`
}

export function HomeBannerSlider({
  banners,
  className,
}: {
  banners: HomeBanner[]
  className?: string
}) {
  const slides = resolveBanners(banners)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const multi = slides.length > 1

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !multi) return

    const onScroll = () => {
      const width = el.clientWidth || 1
      const index = Math.round(el.scrollLeft / width)
      setActive(Math.max(0, Math.min(index, slides.length - 1)))
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [multi, slides.length])

  useEffect(() => {
    if (!multi) return
    const el = scrollerRef.current
    if (!el) return

    const timer = window.setInterval(() => {
      const width = el.clientWidth || 1
      const next = (Math.round(el.scrollLeft / width) + 1) % slides.length
      el.scrollTo({ left: next * width, behavior: 'smooth' })
    }, 5200)

    return () => window.clearInterval(timer)
  }, [multi, slides.length])

  const goTo = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section className={cn('relative w-full', className)}>
      <div
        ref={scrollerRef}
        className="stitch-hide-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-xl shadow-sm lg:rounded-3xl"
        aria-roledescription="carousel"
        aria-label="Promotional banners"
      >
        {slides.map((banner, index) => {
          const href = bannerHref(banner.link)
          const external = href.startsWith('http')
          const title = banner.title ?? 'Fresh deals'
          const subtitle =
            banner.subtitle ??
            (index === 0
              ? 'Start your day with nutrients harvested at dawn.'
              : 'Shop seasonal produce from local farms.')

          const content = (
            <>
              <RemoteImage
                priority={index === 0}
                src={banner.image_url || FALLBACK_IMAGE}
                fallbackSrc={FALLBACK_IMAGE}
                alt={title}
                className="absolute inset-0 z-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/75 via-black/35 to-black/10 sm:bg-gradient-to-r sm:from-black/65 sm:via-black/25 sm:to-transparent" />
              <div className="relative z-20 flex h-full flex-col justify-end px-4 pb-5 pt-10 text-white sm:max-w-xl sm:justify-center sm:px-6 sm:pb-6 sm:pt-6 lg:px-12 lg:pb-8 xl:px-16">
                <span className="mb-1.5 inline-flex self-start rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-on-secondary-container sm:mb-2 sm:px-3 sm:py-1 sm:text-xs">
                  EXCLUSIVE OFFERS
                </span>
                <h2 className="mb-1 text-xl font-bold leading-tight tracking-tight sm:mb-2 sm:text-2xl lg:text-[32px] lg:leading-10">
                  {title}
                </h2>
                <p className="line-clamp-2 max-w-[18rem] text-xs leading-snug text-white/90 sm:max-w-md sm:text-sm lg:text-base lg:leading-6">
                  {subtitle}
                </p>
                <div className="mt-3 hidden gap-3 sm:mt-4 lg:flex">
                  <span className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg">
                    Shop Deals
                  </span>
                </div>
              </div>
            </>
          )

          const slideClass =
            'relative h-[168px] w-full min-w-full shrink-0 snap-center overflow-hidden sm:h-[200px] md:h-[220px] lg:h-[260px]'

          if (external) {
            return (
              <a
                key={`${title}-${index}`}
                href={href}
                target="_blank"
                rel="noreferrer"
                className={slideClass}
              >
                {content}
              </a>
            )
          }

          return (
            <Link key={`${title}-${index}`} to={href} className={slideClass}>
              {content}
            </Link>
          )
        })}
      </div>

      {multi ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-30 flex justify-center gap-1.5 sm:bottom-3">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={active === index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goTo(index)
              }}
              className={cn(
                'pointer-events-auto h-1.5 rounded-full transition-all',
                active === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
