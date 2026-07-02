export type OrderInvoiceItem = {
  name: string
  unit?: string | null
  quantity: number
  unit_price: number
  subtotal: number
}

export type OrderInvoiceData = {
  site_name: string
  site_email?: string | null
  invoice_number: string
  order_uuid: string
  order_status: string
  order_status_label: string
  issued_at?: string | null
  delivered_at?: string | null
  buyer: {
    name: string
    phone?: string | null
    email?: string | null
  }
  delivery_address: {
    label?: string | null
    line?: string | null
    city?: string | null
    pincode?: string | null
  }
  seller: {
    store_name: string
    address_line?: string | null
    city?: string | null
    pincode?: string | null
  }
  items: OrderInvoiceItem[]
  subtotal: number
  delivery_charge: number
  platform_fee: number
  discount: number
  total: number
  coupon_code?: string | null
  payment_method: string
  payment_status: string
  delivery_type?: string | null
  notes?: string | null
  currency?: string
}

export type OrderInvoiceResponse = {
  invoice_url?: string | null
  order_number: string
  invoice: OrderInvoiceData
}
