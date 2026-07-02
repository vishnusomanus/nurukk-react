import { apiClient } from '@/api/client'
import type { OnlinePaymentMethod } from '@/constants/paymentMethods'
import type { GenericSuccess } from '@/types/api'

export type PaymentGateway = 'razorpay' | 'cashfree'

export type PaymentConfig = {
  gateway: PaymentGateway
  currency: string
  cod_enabled?: boolean
  client: {
    key_id?: string
    environment?: string
  }
}

export type RazorpayClientPayload = {
  key_id: string
  order_id: string
  amount: number
  currency: string
}

export type CashfreeClientPayload = {
  order_id: string
  payment_session_id: string
  environment?: string
}

export type PaymentInitiateData = {
  payment_uuid: string
  gateway: PaymentGateway
  gateway_order_id?: string
  amount?: number
  currency?: string
  client?: RazorpayClientPayload | CashfreeClientPayload
  checkout_url?: string
}

export type PaymentStatusData = {
  uuid: string
  status: string
  amount?: number
  currency?: string
  payment_method?: string
  gateway?: string
  gateway_order_id?: string
  gateway_payment_id?: string
  [key: string]: unknown
}

export async function getPaymentConfig() {
  const { data } = await apiClient.get<GenericSuccess<PaymentConfig>>('/v1/payments/config')
  return data
}

export async function initiatePayment(payload: {
  order_uuid: string
  payment_method: OnlinePaymentMethod
}) {
  const { data } = await apiClient.post<GenericSuccess<PaymentInitiateData>>('/v1/payments/initiate', payload)
  return data
}

export async function verifyPayment(payload: {
  payment_uuid: string
  gateway?: PaymentGateway
  payment_id?: string
  order_id?: string
  signature?: string
}) {
  const { data } = await apiClient.post<GenericSuccess<PaymentStatusData>>('/v1/payments/verify', payload)
  return data
}

export async function getPaymentStatus(uuid: string) {
  const { data } = await apiClient.get<GenericSuccess<PaymentStatusData>>(`/v1/payments/${uuid}`)
  return data
}
