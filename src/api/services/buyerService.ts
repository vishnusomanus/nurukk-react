import axios from 'axios'
import { apiClient } from '@/api/client'
import type { CheckoutPaymentMethod } from '@/constants/paymentMethods'
import type { GenericSuccess, Paginated } from '@/types/api'
import type { OrderInvoiceResponse } from '@/types/orderInvoice'
import { pickProductImageUrl } from '@/utils/categoryImage'
import type { ProductNutrition } from '@/utils/productNutrition'

export type BuyerCategory = {
  uuid: string
  name: string
  slug?: string
  image_url?: string
  /** Sample product image used when the category has no dedicated image. */
  product_image_url?: string | null
  icon?: string
  [key: string]: unknown
}

export type BuyerProduct = {
  uuid: string
  name: string
  description?: string
  price: number
  discount_price?: number | null
  unit?: string
  stock?: number
  is_available?: boolean
  images?: string[]
  image_url?: string
  nutrition?: ProductNutrition | null
  avg_rating?: number | null
  rating_count?: number
  can_rate?: boolean
  my_rating?: BuyerProductRating | null
  category?: BuyerCategory
  seller?: {
    uuid?: string
    store_name?: string
    name?: string
    city?: string
    status?: string
    [key: string]: unknown
  }
  deliverable?: boolean
  [key: string]: unknown
}

export type BuyerProductRating = {
  uuid?: string
  rating: number
  user?: {
    uuid?: string
    name?: string
  } | null
  created_at?: string | null
  product?: BuyerProduct | null
}

export type BuyerDeliveryRating = {
  uuid?: string
  rating: number
  comment?: string | null
  delivery_agent?: {
    uuid?: string
    name?: string
  } | null
  user?: {
    uuid?: string
    name?: string
  } | null
  created_at?: string | null
}

export type BuyerSellerSummary = {
  uuid: string
  store_name?: string
  description?: string
  city?: string
  pincode?: string
  status?: string
  product_count?: number
  image_url?: string | null
}

export type BuyerHomeData = {
  banners?: { title?: string; image_url?: string; link?: string }[]
  categories?: BuyerCategory[]
  featured_products?: BuyerProduct[]
  featured_sellers?: BuyerSellerSummary[]
  offers?: { title?: string; code?: string }[]
  recently_purchased?: BuyerProduct[]
  [key: string]: unknown
}

export type CartItem = {
  uuid: string
  quantity: number
  subtotal?: number
  product?: BuyerProduct
  [key: string]: unknown
}

export type CartData = {
  items: CartItem[]
  subtotal?: number
  delivery_charge?: number
  platform_fee?: number
  discount?: number
  total?: number
  coupon_code?: string | null
  store?: {
    uuid: string
    store_name?: string | null
  } | null
  [key: string]: unknown
}

export type CheckoutPreviewData = {
  cart?: CartData
  delivery_options?: unknown[]
  selected_delivery?: {
    delivery_charge?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

/** @deprecated Use CheckoutPreviewData — preview totals live under `cart`. */
export type CheckoutPreview = CheckoutPreviewData

export type BuyerOrderItem = {
  uuid?: string
  product_name?: string
  product_unit?: string
  unit_price?: number
  quantity: number
  subtotal?: number
  product?: BuyerProduct
  buyer_rating?: BuyerProductRating | null
  can_rate?: boolean
  [key: string]: unknown
}

export type BuyerOrder = {
  uuid: string
  order_number?: string
  status: string
  subtotal?: number
  delivery_charge?: number
  platform_fee?: number
  discount?: number
  total?: number
  payment_method?: string
  payment_status?: string
  items?: BuyerOrderItem[]
  address?: BuyerAddress
  estimated_delivery?: string
  created_at?: string
  placed_at?: string
  distance_km?: number
  tracking?: OrderTrackData
  can_rate_delivery?: boolean
  delivery_agent?: {
    uuid?: string
    name?: string | null
  } | null
  delivery_rating?: BuyerDeliveryRating | null
  [key: string]: unknown
}

export type BuyerCoupon = {
  uuid: string
  code: string
  title?: string | null
  issuer?: 'platform' | 'seller'
  type: 'percentage' | 'flat' | 'free_delivery' | 'first_order' | string
  value: number
  min_order_amount: number
  max_discount?: number | null
  starts_at?: string | null
  expires_at?: string | null
  usage_limit?: number | null
  per_user_usage_limit?: number | null
  used_count?: number
  user_eligibility?: string
  new_user_within_days?: number | null
  is_active?: boolean
  seller?: {
    uuid: string
    store_name: string
  } | null
}

export type BuyerAddressPayload = {
  label: string
  address_line: string
  city: string
  pincode: string
  is_default?: boolean
  latitude?: number | null
  longitude?: number | null
}

export type DeliveryOption = {
  delivery_charge?: number
  distance_km?: number
  label?: string
  description?: string
  delivery_type?: string
  [key: string]: unknown
}

export type OrderTrackData = {
  order_number?: string
  current_status?: string
  status_label?: string
  eta_label?: string
  estimated_delivery_minutes_min?: number
  estimated_delivery_minutes_max?: number
  delivery_assigned?: boolean
  delivery_agent_name?: string | null
  delivery_completed_duration_minutes?: number
  delivery_completed_duration_label?: string
  delivery_started_at?: string
  delivery_completed_at?: string
  is_live_delivery?: boolean
  has_live_location?: boolean
  agent_latitude?: number | null
  agent_longitude?: number | null
  dropoff_latitude?: number | null
  dropoff_longitude?: number | null
  location_updated_at?: string | null
  timeline?: { status: string; at: string }[]
  [key: string]: unknown
}

export type UpdateProfilePayload = {
  name?: string
  email?: string
  phone?: string | null
}

export type BuyerAddress = {
  uuid: string
  label?: string
  address_line?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  pincode?: string
  is_default?: boolean
  latitude?: number | null
  longitude?: number | null
  [key: string]: unknown
}

export type WishlistItem = {
  uuid: string
  product?: BuyerProduct
  [key: string]: unknown
}

export type PaymentMethod = CheckoutPaymentMethod | 'upi' | 'card' | 'debit_card' | 'net_banking'

export type DeliveryScopeParams = {
  latitude?: number
  longitude?: number
}

async function enrichHomeCategoriesWithProductImages(
  home: GenericSuccess<BuyerHomeData>,
  params?: DeliveryScopeParams,
): Promise<GenericSuccess<BuyerHomeData>> {
  const categories = home.data?.categories ?? []
  if (categories.length === 0) return home

  const seedProducts = [
    ...(home.data?.featured_products ?? []),
    ...(home.data?.recently_purchased ?? []),
  ]
  const imageByCategory = new Map<string, string>()

  for (const product of seedProducts) {
    const categoryUuid = product.category?.uuid
    const imageUrl = pickProductImageUrl(product)
    if (categoryUuid && imageUrl && !imageByCategory.has(categoryUuid)) {
      imageByCategory.set(categoryUuid, imageUrl)
    }
  }

  for (const category of categories) {
    const existing =
      (typeof category.product_image_url === 'string' && category.product_image_url.trim()) ||
      (typeof category.image_url === 'string' && category.image_url.trim()) ||
      ''
    if (existing && !imageByCategory.has(category.uuid)) {
      imageByCategory.set(category.uuid, existing)
    }
  }

  const missing = categories.filter((category) => !imageByCategory.has(category.uuid))
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (category) => {
        try {
          const response = await listCategoryProducts(category.uuid, {
            ...params,
            page: 1,
            per_page: 1,
          })
          const imageUrl = pickProductImageUrl(response.data?.[0])
          if (imageUrl) imageByCategory.set(category.uuid, imageUrl)
        } catch {
          // Leave category without an image; UI shows a placeholder.
        }
      }),
    )
  }

  return {
    ...home,
    data: {
      ...home.data,
      categories: categories.map((category) => {
        const productImage = imageByCategory.get(category.uuid)
        return {
          ...category,
          product_image_url: category.product_image_url || productImage || null,
          image_url: category.image_url || productImage || undefined,
        }
      }),
    },
  }
}

export async function getHome(params?: DeliveryScopeParams) {
  const { data } = await apiClient.get<GenericSuccess<BuyerHomeData>>('/v1/buyer/home', {
    params: {
      ...params,
      // Backend may return product_image_url per category when supported.
      include_category_product_images: 1,
    },
  })
  return enrichHomeCategoriesWithProductImages(data, params)
}

export async function listCategories() {
  const { data } = await apiClient.get<GenericSuccess<BuyerCategory[]>>('/v1/buyer/categories')
  return data
}

export type ProductTagOption = {
  value: string
  label: string
}

export async function listProductTags() {
  const { data } = await apiClient.get<GenericSuccess<ProductTagOption[]>>('/v1/buyer/product-tags')
  return data
}

export async function listMenuCategories() {
  const { data } = await apiClient.get<GenericSuccess<BuyerCategory[]>>('/v1/buyer/categories', {
    params: { menu: 1 },
  })
  return data
}

export async function listProducts(params?: DeliveryScopeParams & {
  page?: number
  per_page?: number
  q?: string
  search?: string
  category_uuid?: string
  min_price?: number
  max_price?: number
  tag?: string
}) {
  const { q, search, ...rest } = params ?? {}
  const { data } = await apiClient.get<GenericSuccess<BuyerProduct[]>>('/v1/buyer/products', {
    params: {
      ...rest,
      search: search ?? q,
    },
  })
  return data
}

export async function listCategoryProducts(
  categoryUuid: string,
  params?: DeliveryScopeParams & { page?: number; per_page?: number; tag?: string },
) {
  const { data } = await apiClient.get<GenericSuccess<BuyerProduct[]>>(
    `/v1/buyer/categories/${categoryUuid}/products`,
    { params },
  )
  return data
}

export async function getProduct(uuid: string, params?: DeliveryScopeParams) {
  const { data } = await apiClient.get<GenericSuccess<BuyerProduct>>(`/v1/buyer/products/${uuid}`, { params })
  return data
}

export async function getRelatedProducts(uuid: string, params?: DeliveryScopeParams) {
  const { data } = await apiClient.get<GenericSuccess<BuyerProduct[]>>(`/v1/buyer/products/${uuid}/related`, {
    params,
  })
  return data
}

export type DeliveryCheckData = {
  serviceable?: boolean
  is_serviceable?: boolean
  delivery_charge?: number
  max_delivery_radius_km?: number
  nearest_store_km?: number
  reason?: string
  latitude?: number | null
  longitude?: number | null
  city?: string | null
  pincode?: string | null
}

export async function checkDeliveryLocation(params: {
  latitude: number
  longitude: number
  pincode?: string
}) {
  const { data } = await apiClient.get<GenericSuccess<DeliveryCheckData>>('/v1/buyer/delivery/check', {
    params: {
      latitude: params.latitude,
      longitude: params.longitude,
      pincode: params.pincode,
    },
  })
  return data
}

export async function searchProducts(params: DeliveryScopeParams & {
  q: string
  page?: number
  per_page?: number
  seller_per_page?: number
}) {
  const { data } = await apiClient.get<MarketplaceSearchResponse>('/v1/buyer/search', { params })
  return data
}

export async function listSellers(params?: { q?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<BuyerSellerSummary[]>>('/v1/buyer/sellers', {
    params,
  })
  return data
}

export type SellerStoreInfo = {
  uuid: string
  store_name?: string
  description?: string
  city?: string
  pincode?: string
  status?: string
}

export type MarketplaceSearchData = {
  products: BuyerProduct[]
  sellers: BuyerSellerSummary[]
}

export type MarketplaceSearchMeta = {
  products: {
    total: number
    per_page: number
    current_page: number
    next: number
    prev: number
  }
  sellers: {
    total: number
    per_page: number
    current_page: number
    next: number
    prev: number
  }
}

export type MarketplaceSearchResponse = GenericSuccess<MarketplaceSearchData> & {
  meta?: MarketplaceSearchMeta
}

export type SellerStoreData = {
  store: SellerStoreInfo
  products: BuyerProduct[]
  deliverable?: boolean
}

export async function getSellerStore(sellerUuid: string, params?: DeliveryScopeParams) {
  const { data } = await apiClient.get<GenericSuccess<SellerStoreData>>(`/v1/buyer/sellers/${sellerUuid}`, {
    params,
  })
  return data
}

export async function getCart() {
  const { data } = await apiClient.get<GenericSuccess<CartData>>('/v1/buyer/cart')
  return data
}

export async function addCartItem(payload: {
  product_uuid: string
  quantity: number
  replace_cart?: boolean
}) {
  const { data } = await apiClient.post<GenericSuccess<CartData>>('/v1/buyer/cart/items', payload)
  return data
}

export async function updateCartItem(uuid: string, payload: { quantity: number }) {
  const { data } = await apiClient.patch<GenericSuccess<CartData>>(`/v1/buyer/cart/items/${uuid}`, payload)
  return data
}

export async function removeCartItem(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess<CartData>>(`/v1/buyer/cart/items/${uuid}`)
  return data
}

export async function clearCart() {
  const { data } = await apiClient.delete<GenericSuccess<CartData>>('/v1/buyer/cart')
  return data
}

export async function applyCartCoupon(code: string) {
  const { data } = await apiClient.post<GenericSuccess<CartData>>('/v1/buyer/cart/apply-coupon', { code })
  return data
}

export async function removeCartCoupon() {
  const { data } = await apiClient.delete<GenericSuccess<CartData>>('/v1/buyer/cart/coupon')
  return data
}

export async function listAvailableCoupons() {
  const { data } = await apiClient.get<GenericSuccess<BuyerCoupon[]>>('/v1/buyer/coupons/available')
  return data
}

export async function getCheckoutPreview(params?: {
  address_uuid?: string
  delivery_type?: 'platform' | 'seller_own'
}) {
  const { data } = await apiClient.get<GenericSuccess<CheckoutPreviewData>>('/v1/buyer/checkout/preview', {
    params,
  })
  return data
}

export async function checkout(payload: {
  address_uuid: string
  payment_method: CheckoutPaymentMethod
  delivery_type?: 'platform' | 'seller_own'
  coupon_code?: string | null
  notes?: string | null
}) {
  const { data } = await apiClient.post<GenericSuccess<BuyerOrder>>('/v1/buyer/checkout', payload)
  return data
}

export async function listOrders(params?: {
  page?: number
  per_page?: number
  status?: string
  date?: string
}) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<BuyerOrder> | BuyerOrder[]>>(
    '/v1/buyer/orders',
    { params },
  )
  return data
}

export async function trackOrder(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<OrderTrackData>>(`/v1/buyer/orders/${uuid}/track`)
  return data
}

export async function getInvoice(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<OrderInvoiceResponse>>(`/v1/buyer/orders/${uuid}/invoice`)
  return data
}

export async function rateOrder(
  uuid: string,
  payload: { rating: number; product_uuid: string },
) {
  const { data } = await apiClient.post<GenericSuccess<BuyerProductRating>>(
    `/v1/buyer/orders/${uuid}/rate`,
    payload,
  )
  return data
}

export async function rateDelivery(
  uuid: string,
  payload: { rating: number; comment: string },
) {
  const { data } = await apiClient.post<GenericSuccess<BuyerDeliveryRating>>(
    `/v1/buyer/orders/${uuid}/rate-delivery`,
    payload,
  )
  return data
}

export async function listProductRatings(uuid: string, params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<BuyerProductRating> | BuyerProductRating[]>>(
    `/v1/buyer/products/${uuid}/ratings`,
    { params },
  )
  return data
}

export async function rateProduct(uuid: string, payload: { rating: number }) {
  const { data } = await apiClient.post<GenericSuccess<BuyerProductRating>>(
    `/v1/buyer/products/${uuid}/rate`,
    payload,
  )
  return data
}

export async function cancelOrder(uuid: string, reason?: string) {
  const { data } = await apiClient.post<GenericSuccess<BuyerOrder>>(`/v1/buyer/orders/${uuid}/cancel`, {
    reason,
  })
  return data
}

export async function downloadOrderInvoicePdf(uuid: string) {
  await downloadOrderInvoiceFile(uuid, 'pdf')
}

export async function downloadOrderInvoice(uuid: string) {
  await downloadOrderInvoicePdf(uuid)
}

async function downloadOrderInvoiceFile(uuid: string, format: 'pdf' | 'html') {
  try {
    const response = await apiClient.get<Blob>(`/v1/buyer/orders/${uuid}/invoice/download`, {
      params: { format },
      responseType: 'blob',
    })

    const contentType = String(response.headers['content-type'] ?? '')
    if (contentType.includes('application/json')) {
      throw new Error(await readBlobApiErrorMessage(response.data, 'Failed to download invoice'))
    }

    const disposition = response.headers['content-disposition'] as string | undefined
    const match = disposition?.match(/filename="?([^"]+)"?/)
    const fallbackExt = format === 'pdf' ? 'pdf' : 'html'
    const filename = match?.[1] ?? `invoice-${uuid}.${fallbackExt}`
    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const contentType = String(error.response.headers['content-type'] ?? '')
      if (contentType.includes('application/json')) {
        throw new Error(
          await readBlobApiErrorMessage(error.response.data, 'Failed to download invoice'),
        )
      }
    }
    throw error
  }
}

async function readBlobApiErrorMessage(blob: Blob, fallback: string): Promise<string> {
  try {
    const text = await blob.text()
    const payload = JSON.parse(text) as { message?: string; errors?: unknown }
    const detail = flattenBlobErrorDetail(payload.errors)
    if (detail) return detail
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message
  } catch {
    // ignore parse errors
  }
  return fallback
}

function flattenBlobErrorDetail(errors: unknown): string | null {
  if (errors == null) return null
  if (typeof errors === 'string') return errors.trim() || null
  if (Array.isArray(errors)) {
    for (const item of errors) {
      const nested = flattenBlobErrorDetail(item)
      if (nested) return nested
    }
    return null
  }
  if (typeof errors === 'object') {
    for (const value of Object.values(errors as Record<string, unknown>)) {
      const nested = flattenBlobErrorDetail(value)
      if (nested) return nested
    }
  }
  return null
}

export async function getOrder(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<BuyerOrder>>(`/v1/buyer/orders/${uuid}`)
  return data
}

export async function listAddresses() {
  const { data } = await apiClient.get<GenericSuccess<BuyerAddress[]>>('/v1/buyer/addresses')
  return data
}

export async function createAddress(payload: BuyerAddressPayload) {
  const { data } = await apiClient.post<GenericSuccess<BuyerAddress>>('/v1/buyer/addresses', payload)
  return data
}

export async function updateAddress(uuid: string, payload: Partial<BuyerAddressPayload>) {
  const { data } = await apiClient.patch<GenericSuccess<BuyerAddress>>(
    `/v1/buyer/addresses/${uuid}`,
    payload,
  )
  return data
}

export async function setDefaultAddress(uuid: string) {
  const { data } = await apiClient.post<GenericSuccess<BuyerAddress>>(
    `/v1/buyer/addresses/${uuid}/default`,
  )
  return data
}

export async function deleteAddress(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess<null>>(`/v1/buyer/addresses/${uuid}`)
  return data
}

export async function getDeliveryOptions(addressUuid: string) {
  const { data } = await apiClient.get<GenericSuccess<{ options?: DeliveryOption[] }>>(
    '/v1/buyer/delivery/options',
    { params: { address_uuid: addressUuid } },
  )
  return data
}

export async function listWishlist() {
  const { data } = await apiClient.get<GenericSuccess<BuyerProduct[]>>('/v1/buyer/wishlist')
  return data
}

export async function addWishlist(productUuid: string) {
  const { data } = await apiClient.post<GenericSuccess<BuyerProduct[]>>(`/v1/buyer/wishlist/${productUuid}`)
  return data
}

export async function removeWishlist(productUuid: string) {
  const { data } = await apiClient.delete<GenericSuccess<BuyerProduct[]>>(`/v1/buyer/wishlist/${productUuid}`)
  return data
}

export async function toggleWishlist(productUuid: string) {
  const { data } = await apiClient.patch<GenericSuccess<BuyerProduct[]>>(
    `/v1/buyer/wishlist/${productUuid}/toggle`,
  )
  return data
}
