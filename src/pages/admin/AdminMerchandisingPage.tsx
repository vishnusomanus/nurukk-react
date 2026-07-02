import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminMerchandisingService } from '@/api/services'
import { Pagination } from '@/components/ui/Pagination'
import { buildClientPaginationMeta, paginateSlice } from '@/utils/clientPagination'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

const PAGE_SIZE = 10

export function AdminMerchandisingPage() {
  const queryClient = useQueryClient()
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerImage, setBannerImage] = useState('')
  const [featuredProductUuid, setFeaturedProductUuid] = useState('')
  const [bannerPage, setBannerPage] = useState(1)
  const [featuredPage, setFeaturedPage] = useState(1)

  const { data: bannersData } = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => adminMerchandisingService.listBanners(),
  })

  const { data: featuredData } = useQuery({
    queryKey: ['admin', 'featured-products'],
    queryFn: () => adminMerchandisingService.listFeaturedProducts(),
  })

  const createBanner = useMutation({
    mutationFn: () =>
      adminMerchandisingService.createBanner({
        title: bannerTitle.trim(),
        image_url: bannerImage.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      setBannerTitle('')
      setBannerImage('')
      setBannerPage(1)
    },
  })

  const deleteBanner = useMutation({
    mutationFn: (id: number) => adminMerchandisingService.deleteBanner(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  })

  const createFeatured = useMutation({
    mutationFn: () =>
      adminMerchandisingService.createFeaturedProduct({ product_uuid: featuredProductUuid.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'featured-products'] })
      setFeaturedProductUuid('')
      setFeaturedPage(1)
    },
  })

  const deleteFeatured = useMutation({
    mutationFn: (id: number) => adminMerchandisingService.deleteFeaturedProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'featured-products'] }),
  })

  const banners = bannersData?.data ?? []
  const featured = featuredData?.data ?? []

  const bannerMeta = useMemo(
    () => buildClientPaginationMeta(banners.length, bannerPage, PAGE_SIZE),
    [banners.length, bannerPage],
  )
  const pageBanners = useMemo(
    () => paginateSlice(banners, bannerMeta.current_page, PAGE_SIZE),
    [banners, bannerMeta.current_page],
  )

  const featuredMeta = useMemo(
    () => buildClientPaginationMeta(featured.length, featuredPage, PAGE_SIZE),
    [featured.length, featuredPage],
  )
  const pageFeatured = useMemo(
    () => paginateSlice(featured, featuredMeta.current_page, PAGE_SIZE),
    [featured, featuredMeta.current_page],
  )

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-headline-xl text-on-surface">Merchandising</h1>

      <section className="space-y-4 rounded-xl border border-outline-variant bg-surface p-6">
        <h2 className="text-headline-lg text-on-surface">Home banners</h2>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            createBanner.mutate()
          }}
        >
          <input
            required
            value={bannerTitle}
            onChange={(e) => setBannerTitle(e.target.value)}
            placeholder="Title"
            className="rounded-lg border px-3 py-2"
          />
          <input
            required
            value={bannerImage}
            onChange={(e) => setBannerImage(e.target.value)}
            placeholder="Image URL"
            className="min-w-[240px] flex-1 rounded-lg border px-3 py-2"
          />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-on-primary">
            Add banner
          </button>
        </form>
        {createBanner.isError ? (
          <p className="text-sm text-error">{getApiErrorMessage(createBanner.error, 'Failed')}</p>
        ) : null}
        <ul className="space-y-2">
          {pageBanners.map((banner) => (
            <li key={banner.id} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
              <span className="text-on-surface">{banner.title}</span>
              <button type="button" className="text-error" onClick={() => deleteBanner.mutate(banner.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
        {banners.length > 0 ? <Pagination meta={bannerMeta} onPageChange={setBannerPage} /> : null}
      </section>

      <section className="space-y-4 rounded-xl border border-outline-variant bg-surface p-6">
        <h2 className="text-headline-lg text-on-surface">Featured products</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            createFeatured.mutate()
          }}
        >
          <input
            required
            value={featuredProductUuid}
            onChange={(e) => setFeaturedProductUuid(e.target.value)}
            placeholder="Product UUID"
            className="min-w-[280px] flex-1 rounded-lg border px-3 py-2"
          />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-on-primary">
            Feature
          </button>
        </form>
        <ul className="space-y-2">
          {pageFeatured.map((row) => (
            <li key={row.id} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
              <span className="text-on-surface">{row.product?.name ?? row.product_uuid ?? row.id}</span>
              <button type="button" className="text-error" onClick={() => deleteFeatured.mutate(row.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        {featured.length > 0 ? <Pagination meta={featuredMeta} onPageChange={setFeaturedPage} /> : null}
      </section>
    </div>
  )
}
