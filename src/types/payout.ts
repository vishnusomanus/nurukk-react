export type PayoutAccount = {
  account_holder_name: string
  upi_id?: string | null
  bank_name?: string | null
  bank_account_number?: string | null
  bank_ifsc?: string | null
  is_verified?: boolean
  has_transfer_details?: boolean
}

export type PayoutSummary = {
  total_paid_out: number
  pending_payout: number
  upcoming_earnings?: number
  next_delivery_payout_at?: string
  next_seller_payout_at?: string
  delivery_payout_schedule?: string
  seller_payout_schedule?: string
  payout_account?: PayoutAccount | null
}

export type PayoutItem = {
  order_uuid?: string
  order_number?: string
  amount: number
  description?: string
}

export type PayoutRecord = {
  uuid: string
  payee_type: string
  amount: number
  currency?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  period_start?: string | null
  period_end?: string | null
  scheduled_at?: string | null
  processed_at?: string | null
  reference?: string | null
  failure_reason?: string | null
  order_count?: number
  items?: PayoutItem[]
  transfer_details?: {
    method?: string | null
    account_holder?: string | null
  }
}

export type PayoutPayee = {
  uuid?: string
  name?: string
  phone?: string
  email?: string
  role?: string
  store_name?: string | null
}

export type AdminPayoutRecord = PayoutRecord & {
  payee?: PayoutPayee
  payout_account?: PayoutAccount | null
}

export type AdminPayoutStatistics = {
  total_paid_out: number
  seller_paid_out: number
  delivery_paid_out: number
  pending_payouts: number
  seller_pending: number
  delivery_pending: number
  platform_fees_collected: number
  payout_counts: {
    completed: number
    pending: number
    failed: number
  }
  unsettled_upcoming: {
    seller: number
    delivery_agent: number
  }
  payees_missing_account: {
    sellers: number
    delivery_agents: number
  }
  recent_payouts: AdminPayoutRecord[]
  schedules: {
    delivery_agent: string
    seller: string
  }
}

export type PayoutAccountPayload = {
  account_holder_name: string
  upi_id?: string
  bank_name?: string
  bank_account_number?: string
  bank_ifsc?: string
}
