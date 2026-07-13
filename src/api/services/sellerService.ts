import { apiClient } from '@/api/client'
import type { GenericSuccess, Paginated } from '@/types/api'
import type { ProductNutrition } from '@/utils/productNutrition'

export type SellerDashboardData = {
  today_sales?: number
  total_orders?: number
  pending_orders?: number
  earnings?: number
}

export async function getDashboard() {
  const { data } = await apiClient.get<GenericSuccess<SellerDashboardData>>('/v1/seller/dashboard')
  return data
}

export type SellerProduct = {
  uuid: string
  name: string
  description?: string | null
  price?: number
  discount_price?: number | null
  stock?: number
  unit?: string
  is_available?: boolean
  status?: string
  images?: string[]
  image_url?: string | null
  tags?: Array<{ value: string; label: string } | string>
  nutrition?: ProductNutrition | null
  [key: string]: unknown
}

export type CreateProductPayload = {
  name: string
  category_uuid: string
  price: number
  unit: string
  stock: number
  description?: string | null
  discount_price?: number | null
  tags?: string[]
  nutrition?: ProductNutrition | null
}

export type UpdateProductPayload = Partial<{
  name: string
  category_uuid: string
  description: string | null
  price: number
  discount_price: number | null
  stock: number
  is_available: boolean
  tags: string[]
  nutrition: ProductNutrition | null
}>

export async function listProducts(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<SellerProduct> | SellerProduct[]>>(
    '/v1/seller/products',
    { params },
  )
  return data
}

export async function getProduct(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<SellerProduct>>(`/v1/seller/products/${uuid}`)
  return data
}

export async function createProduct(payload: CreateProductPayload) {
  const { data } = await apiClient.post<GenericSuccess<SellerProduct>>('/v1/seller/products', payload)
  return data
}

export async function updateProduct(uuid: string, payload: UpdateProductPayload) {
  const { data } = await apiClient.put<GenericSuccess<SellerProduct>>(`/v1/seller/products/${uuid}`, payload)
  return data
}

export async function deleteProduct(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess<null>>(`/v1/seller/products/${uuid}`)
  return data
}

export async function uploadProductImages(uuid: string, images: string[]) {
  const { data } = await apiClient.post<GenericSuccess<SellerProduct>>(`/v1/seller/products/${uuid}/images`, {
    images,
  })
  return data
}

export type NutritionLookupStatus = {
  available: boolean
  reason?: string | null
  primary_provider?: string
  fallback_provider?: string
  serving_basis?: string
  open_food_facts?: {
    available?: boolean
    reason?: string | null
    requests_this_month?: number
    monthly_limit?: number
    source_url?: string
  }
  usda?: {
    available?: boolean
    reason?: string | null
    requests_this_month?: number
    monthly_limit?: number
  }
}

export type NutritionLookupResult = {
  nutrition?: ProductNutrition | null
  source?: {
    provider?: string
    food_name?: string
    product_url?: string
    fdc_id?: number | null
    serving_basis?: string
    license?: string
    fallback?: boolean
  }
}

export async function getNutritionLookupStatus() {
  const { data } = await apiClient.get<GenericSuccess<NutritionLookupStatus>>('/v1/seller/nutrition/status')
  return data
}

export async function lookupProductNutrition(query: string) {
  const { data } = await apiClient.get<GenericSuccess<NutritionLookupResult>>('/v1/seller/nutrition/lookup', {
    params: { query },
  })
  return data
}

/** @deprecated Use getNutritionLookupStatus */
export async function getUsdaNutritionStatus() {
  return getNutritionLookupStatus()
}

/** @deprecated Use lookupProductNutrition */
export async function lookupUsdaNutrition(query: string) {
  return lookupProductNutrition(query)
}

export type SellerOrder = {
  uuid: string
  status: string
  total?: number
  order_number?: string
  created_at?: string
  subtotal?: number
  delivery_charge?: number
  platform_fee?: number
  discount?: number
  payment_method?: string
  payment_status?: string
  notes?: string | null
  [key: string]: unknown
}

export type SellerOrderItem = {
  product_name: string
  product_unit?: string
  unit_price: number
  quantity: number
  subtotal: number
  product?: {
    uuid?: string
    image_url?: string | null
    name?: string
    unit?: string
  } | null
}

export type SellerOrderDetail = SellerOrder & {
  items?: SellerOrderItem[]
  address?: {
    label?: string
    address_line?: string
    city?: string
    pincode?: string
  }
  buyer?: {
    uuid?: string
    name?: string
    phone?: string
  }
}

export async function listOrders(params?: { page?: number; per_page?: number; status?: string }) {
  const { data } = await apiClient.get<GenericSuccess<Paginated<SellerOrder>>>('/v1/seller/orders', {
    params,
  })
  return data
}

export async function getOrder(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<SellerOrderDetail>>(`/v1/seller/orders/${uuid}`)
  return data
}

export async function updateOrderStatus(uuid: string, status: string) {
  const { data } = await apiClient.patch<GenericSuccess<SellerOrder>>(`/v1/seller/orders/${uuid}/status`, {
    status,
  })
  return data
}

export async function rejectOrder(uuid: string, reason?: string) {
  const { data } = await apiClient.post<GenericSuccess<SellerOrder>>(`/v1/seller/orders/${uuid}/reject`, {
    reason,
  })
  return data
}

export type InventoryItem = {
  uuid: string
  name?: string
  stock?: number
  low_stock_threshold?: number
  [key: string]: unknown
}

export async function listInventory() {
  const { data } = await apiClient.get<GenericSuccess<InventoryItem[]>>('/v1/seller/inventory')
  return data
}

export async function updateInventory(uuid: string, stock: number) {
  const { data } = await apiClient.patch<GenericSuccess<InventoryItem>>(`/v1/seller/inventory/${uuid}`, { stock })
  return data
}

export type DailySalesPoint = {
  date: string
  label: string
  sales: number
  orders: number
}

export type SalesReport = {
  period?: string
  total_sales?: number
  total_orders?: number
  top_products?: Array<{ name: string; quantity_sold: number }>
  daily_sales?: DailySalesPoint[]
}

export async function getSalesReport(period?: 'week' | 'month') {
  const { data } = await apiClient.get<GenericSuccess<SalesReport>>('/v1/seller/reports/sales', {
    params: period ? { period } : undefined,
  })
  return data
}

export async function getPayoutSummary() {
  const { data } = await apiClient.get<GenericSuccess<import('@/types/payout').PayoutSummary>>('/v1/seller/payouts/summary')
  return data
}

export async function listPayouts(params?: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<GenericSuccess<import('@/types/payout').PayoutRecord[]>>('/v1/seller/payouts', {
    params,
  })
  return data
}

export async function getPayout(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<import('@/types/payout').PayoutRecord>>(`/v1/seller/payouts/${uuid}`)
  return data
}

export async function getPayoutAccount() {
  const { data } = await apiClient.get<GenericSuccess<import('@/types/payout').PayoutAccount | null>>(
    '/v1/seller/payout-account',
  )
  return data
}

export async function savePayoutAccount(payload: import('@/types/payout').PayoutAccountPayload) {
  const { data } = await apiClient.put<GenericSuccess<import('@/types/payout').PayoutAccount>>(
    '/v1/seller/payout-account',
    payload,
  )
  return data
}

export type SellerProfile = {
  uuid: string
  name: string
  description?: string | null
  city?: string | null
  pincode?: string | null
  address_line?: string | null
  latitude?: number | null
  longitude?: number | null
  delivery_radius_km?: number
  offers_own_delivery?: boolean
  offers_platform_delivery?: boolean
  phone?: string | null
  status?: string
  approval_notes?: string | null
}

export async function getProfile() {
  const { data } = await apiClient.get<GenericSuccess<SellerProfile>>('/v1/seller/profile')
  return data
}

export type UpdateSellerProfilePayload = {
  store_name?: string
  description?: string | null
  city?: string | null
  pincode?: string | null
}

export async function updateProfile(payload: UpdateSellerProfilePayload) {
  const { data } = await apiClient.patch<GenericSuccess<SellerProfile>>('/v1/seller/profile', payload)
  return data
}

export type RegisterSellerPayload = {
  store_name: string
  description?: string
  city?: string
  pincode?: string
}

export async function registerSeller(payload: RegisterSellerPayload) {
  const { data } = await apiClient.post<GenericSuccess<SellerProfile>>('/v1/seller/register', payload)
  return data
}

export async function listLowStock() {
  const { data } = await apiClient.get<GenericSuccess<InventoryItem[]>>('/v1/seller/inventory/low-stock')
  return data
}

export type SellerDeliverySettings = {
  address_line?: string | null
  latitude?: number | null
  longitude?: number | null
  delivery_radius_km?: number
  max_delivery_radius_km?: number
  offers_own_delivery?: boolean
  offers_platform_delivery?: boolean
}

export type DeliveryEmployee = {
  uuid: string
  display_name?: string
  phone?: string
  vehicle_type?: string
  is_available?: boolean
  is_active?: boolean
}

export async function getDeliverySettings() {
  const { data } = await apiClient.get<GenericSuccess<SellerDeliverySettings>>('/v1/seller/delivery/settings')
  return data
}

export async function updateDeliverySettings(payload: Partial<SellerDeliverySettings>) {
  const { data } = await apiClient.patch<GenericSuccess<SellerDeliverySettings>>(
    '/v1/seller/delivery/settings',
    payload,
  )
  return data
}

export async function listDeliveryEmployees() {
  const { data } = await apiClient.get<GenericSuccess<DeliveryEmployee[]>>('/v1/seller/delivery/employees')
  return data
}

export async function createDeliveryEmployee(payload: {
  display_name: string
  phone: string
  vehicle_type?: string
}) {
  const { data } = await apiClient.post<GenericSuccess<DeliveryEmployee>>('/v1/seller/delivery/employees', payload)
  return data
}

export async function updateDeliveryEmployee(
  uuid: string,
  payload: Partial<{ display_name: string; phone: string; vehicle_type: string; is_available: boolean }>,
) {
  const { data } = await apiClient.patch<GenericSuccess<DeliveryEmployee>>(
    `/v1/seller/delivery/employees/${uuid}`,
    payload,
  )
  return data
}

export async function deleteDeliveryEmployee(uuid: string) {
  const { data } = await apiClient.delete<GenericSuccess>(`/v1/seller/delivery/employees/${uuid}`)
  return data
}
