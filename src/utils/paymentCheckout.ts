import { Capacitor } from '@capacitor/core'
import { Checkout } from 'capacitor-razorpay'
import { APP_NAME } from '@/constants/app'
import type { OnlinePaymentMethod } from '@/constants/paymentMethods'
import type {
  CashfreeClientPayload,
  PaymentGateway,
  PaymentInitiateData,
  RazorpayClientPayload,
} from '@/api/services/paymentService'
import type { AuthUser } from '@/store/authStore'

export type PaymentCheckoutResult = 'paid' | 'dismissed' | 'failed'

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'
const CASHFREE_SCRIPT = 'https://sdk.cashfree.com/js/v3/cashfree.js'

function loadScript(src: string, id: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null
  if (existing?.dataset.loaded === 'true') {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${id}`))
    if (!existing) document.head.appendChild(script)
  })
}

async function waitForGlobal<T>(
  read: () => T | undefined,
  label: string,
  timeoutMs = 8000,
): Promise<T> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const value = read()
    if (value) return value
    await new Promise((resolve) => window.setTimeout(resolve, 50))
  }
  throw new Error(`${label} SDK failed to load`)
}

export async function preloadPaymentGateway(gateway?: PaymentGateway): Promise<void> {
  // Native Capacitor uses the Razorpay Android/iOS SDK — no web script needed.
  if (gateway === 'razorpay' && Capacitor.isNativePlatform()) return

  if (gateway === 'razorpay') {
    await loadScript(RAZORPAY_SCRIPT, 'razorpay-checkout-js')
    return
  }
  if (gateway === 'cashfree') {
    await loadScript(CASHFREE_SCRIPT, 'cashfree-checkout-js')
  }
}

function razorpayMethod(method: OnlinePaymentMethod): string | undefined {
  if (method === 'card') return 'card'
  if (method === 'upi') return 'upi'
  return undefined
}

function isRazorpayClient(client: unknown): client is RazorpayClientPayload {
  return (
    typeof client === 'object' &&
    client !== null &&
    'key_id' in client &&
    'order_id' in client &&
    'amount' in client
  )
}

function isCashfreeClient(client: unknown): client is CashfreeClientPayload {
  return (
    typeof client === 'object' &&
    client !== null &&
    'payment_session_id' in client &&
    'order_id' in client
  )
}

function cashfreeMode(environment?: string): 'sandbox' | 'production' {
  return environment === 'production' ? 'production' : 'sandbox'
}

function buildRazorpayOptions(
  client: RazorpayClientPayload,
  paymentMethod: OnlinePaymentMethod,
  user: AuthUser | null,
) {
  const method = razorpayMethod(paymentMethod)
  return {
    key: client.key_id,
    amount: String(client.amount),
    currency: client.currency || 'INR',
    order_id: client.order_id,
    name: APP_NAME,
    description: 'Order payment',
    ...(method ? { method } : {}),
    theme: { color: '#0d631b' },
    prefill: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      contact: user?.phone ?? '',
    },
  }
}

function extractCapacitorErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (!error || typeof error !== 'object') return String(error ?? '')

  const record = error as Record<string, unknown>
  const candidates = [record.message, record.errorMessage, record.code, record.error]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate
  }
  try {
    return JSON.stringify(error)
  } catch {
    return 'Payment failed'
  }
}

function isRazorpayUserCancel(error: unknown): boolean {
  const raw = extractCapacitorErrorMessage(error)
  return /cancel|dismissed|code["']?\s*:\s*2\b|payment canceled by user/i.test(raw)
}

function isNativePluginMissing(error: unknown): boolean {
  const raw = extractCapacitorErrorMessage(error)
  return /unimplemented|not implemented|\"Checkout\" plugin is not implemented|plugin_not_installed/i.test(
    raw,
  )
}

/** Native SDK avoids window.open / new-tab bank redirects that break in Capacitor WebViews. */
async function openRazorpayNativeCheckout(
  client: RazorpayClientPayload,
  paymentMethod: OnlinePaymentMethod,
  user: AuthUser | null,
): Promise<PaymentCheckoutResult> {
  try {
    const result = await Checkout.open(
      buildRazorpayOptions(client, paymentMethod, user) as { key: string; amount: string },
    )
    const response = (result as { response?: unknown })?.response
    if (response) return 'paid'
    return 'dismissed'
  } catch (error) {
    if (isRazorpayUserCancel(error)) return 'dismissed'
    if (isNativePluginMissing(error)) {
      // iOS SPM projects previously lacked the CocoaPods-only plugin — fall back to web SDK.
      console.warn('[payments] Native Razorpay plugin unavailable; falling back to web checkout', error)
      return openRazorpayWebCheckout(client, paymentMethod, user)
    }
    const detail = extractCapacitorErrorMessage(error)
    throw new Error(detail || 'Payment failed')
  }
}

async function openRazorpayWebCheckout(
  client: RazorpayClientPayload,
  paymentMethod: OnlinePaymentMethod,
  user: AuthUser | null,
): Promise<PaymentCheckoutResult> {
  await loadScript(RAZORPAY_SCRIPT, 'razorpay-checkout-js')

  const RazorpayCtor = await waitForGlobal(() => window.Razorpay, 'Razorpay')
  const options = buildRazorpayOptions(client, paymentMethod, user)

  return new Promise((resolve) => {
    const rzp = new RazorpayCtor({
      ...options,
      amount: Number(options.amount),
      handler: () => resolve('paid'),
      modal: {
        ondismiss: () => resolve('dismissed'),
      },
    })

    rzp.on('payment.failed', () => resolve('failed'))
    rzp.open()
  })
}

async function openRazorpayCheckout(
  initiate: PaymentInitiateData,
  paymentMethod: OnlinePaymentMethod,
  user: AuthUser | null,
): Promise<PaymentCheckoutResult> {
  const client = initiate.client
  if (!isRazorpayClient(client)) {
    throw new Error('Invalid Razorpay checkout payload')
  }

  if (Capacitor.isNativePlatform()) {
    return openRazorpayNativeCheckout(client, paymentMethod, user)
  }

  return openRazorpayWebCheckout(client, paymentMethod, user)
}

async function openCashfreeCheckout(initiate: PaymentInitiateData): Promise<PaymentCheckoutResult> {
  const client = initiate.client
  if (!isCashfreeClient(client)) {
    throw new Error('Invalid Cashfree checkout payload')
  }

  await loadScript(CASHFREE_SCRIPT, 'cashfree-checkout-js')

  const CashfreeCtor = await waitForGlobal(() => window.Cashfree, 'Cashfree')
  const mode = cashfreeMode(client.environment)

  const cashfree = CashfreeCtor({ mode })
  // Keep checkout in-app. `_blank` opens a new tab/window that breaks Capacitor WebViews.
  const result = await cashfree.checkout({
    paymentSessionId: client.payment_session_id,
    redirectTarget: '_modal',
  })

  if (result.error) {
    const message =
      typeof result.error === 'object' && result.error && 'message' in result.error
        ? String((result.error as { message?: string }).message)
        : ''
    throw new Error(
      message ||
        'Cashfree checkout could not open. Whitelist your site domain (e.g. localhost) in the Cashfree sandbox dashboard.',
    )
  }
  if (result.paymentDetails) return 'paid'
  return 'dismissed'
}

/** Opens Razorpay modal or Cashfree checkout from initiate API response. */
export async function openPaymentGateway(args: {
  initiate: PaymentInitiateData
  paymentMethod: OnlinePaymentMethod
  user: AuthUser | null
}): Promise<PaymentCheckoutResult> {
  const gateway = args.initiate.gateway

  if (gateway === 'razorpay') {
    return openRazorpayCheckout(args.initiate, args.paymentMethod, args.user)
  }

  if (gateway === 'cashfree') {
    return openCashfreeCheckout(args.initiate)
  }

  throw new Error(`Unsupported payment gateway: ${gateway}`)
}

export function gatewayLabel(gateway?: PaymentGateway): string {
  if (gateway === 'cashfree') return 'Cashfree'
  if (gateway === 'razorpay') return 'Razorpay'
  return 'Payment gateway'
}
