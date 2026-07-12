import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyerService, paymentService } from '@/api/services'
import type { BuyerProduct, CartItem } from '@/api/services/buyerService'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { CheckoutCouponCard } from '@/components/buyer/CheckoutCouponCard'
import {
  CheckoutDeliveryAddress,
  type CheckoutDeliveryAddressHandle,
} from '@/components/buyer/CheckoutDeliveryAddress'
import { CheckoutFreshnessCard } from '@/components/buyer/CheckoutFreshnessCard'
import { ConfirmActionModal } from '@/components/buyer/ConfirmActionModal'
import { DeliveryLocationControl } from '@/components/buyer/DeliveryLocationControl'
import { NoStoresNearbyCard } from '@/components/buyer/NoStoresNearbyCard'
import { OrderSummaryCard } from '@/components/buyer/OrderSummaryCard'
import { useCheckoutAddress } from '@/hooks/useCheckoutAddress'
import { ProductImage } from '@/components/buyer/ProductImage'
import { useDeliveryLocation } from '@/context/DeliveryLocationProvider'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatCouponHint } from '@/utils/couponLabel'
import { resolveCheckoutTotals } from '@/utils/checkoutSummary'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { gatewayLabel } from '@/utils/paymentCheckout'
import { cn } from '@/utils/cn'

function productSubtitle(product?: BuyerProduct) {
  const parts: string[] = []
  if (product?.category?.name) parts.push(product.category.name)
  if (product?.unit) parts.push(product.unit)
  return parts.join(' • ')
}

const softCard =
  'rounded-2xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none'

export function CheckoutSummaryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addressUuid, addresses, hasAddress, setAddressUuid } = useCheckoutAddress()
  const { stored } = useDeliveryLocation()
  const noStoresInRange = Boolean(stored && !stored.serviceable)
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const addressRef = useRef<CheckoutDeliveryAddressHandle>(null)

  const { data: cartData, isLoading, error } = useQuery({
    queryKey: ['buyer', 'cart'],
    queryFn: () => buyerService.getCart(),
  })

  const { data: previewData } = useQuery({
    queryKey: ['buyer', 'checkout-preview', addressUuid],
    queryFn: () =>
      buyerService.getCheckoutPreview(
        addressUuid ? { address_uuid: addressUuid, delivery_type: 'platform' } : undefined,
      ),
  })

  const { data: paymentConfigData } = useQuery({
    queryKey: ['payments', 'config'],
    queryFn: () => paymentService.getPaymentConfig(),
  })

  const cart = cartData?.data
  const items = cart?.items ?? []

  const { data: availableCouponsData } = useQuery({
    queryKey: ['buyer', 'coupons', 'available'],
    queryFn: () => buyerService.listAvailableCoupons(),
    enabled: items.length > 0,
  })

  const appliedCouponCode = cart?.coupon_code ?? previewData?.data?.cart?.coupon_code ?? null
  const availableCoupons = availableCouponsData?.data ?? []
  const couponHint =
    !appliedCouponCode && availableCoupons[0] ? formatCouponHint(availableCoupons[0]) : null

  const updateQty = useMutation({
    mutationFn: ({ uuid, quantity }: { uuid: string; quantity: number }) =>
      buyerService.updateCartItem(uuid, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', 'cart'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'checkout-preview'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'coupons', 'available'] })
    },
  })

  const removeItem = useMutation({
    mutationFn: (uuid: string) => buyerService.removeCartItem(uuid),
    onSuccess: () => {
      setRemoveTarget(null)
      queryClient.invalidateQueries({ queryKey: ['buyer', 'cart'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'checkout-preview'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'coupons', 'available'] })
    },
  })

  const clearCart = useMutation({
    mutationFn: () => buyerService.clearCart(),
    onSuccess: () => {
      setConfirmClearOpen(false)
      queryClient.invalidateQueries({ queryKey: ['buyer', 'cart'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'checkout-preview'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'coupons', 'available'] })
    },
  })

  const totals = resolveCheckoutTotals(previewData?.data, cart)
  const { subtotal, delivery, platformFee, discount, total } = totals
  const activeGateway = paymentConfigData?.data?.gateway

  const focusAddressSection = () => {
    addressRef.current?.requireAddress()
    requestAnimationFrame(() => {
      document.getElementById('checkout-delivery-address')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }

  const handleProceed = () => {
    if (!hasAddress) {
      focusAddressSection()
      return
    }
    navigate('/buyer/checkout/payment')
  }

  return (
    <div className="app-page-pad-bottom-cta pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      <BuyerPageHeader title="Cart" backTo="/buyer" />

      <main className="app-page-pad-top buyer-page-container lg:pt-8">
        <h1 className="text-headline-xl mb-6 hidden text-primary lg:mb-8 lg:block">Review Your Order</h1>

        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {getApiErrorMessage(error, 'Failed to load cart')}
          </p>
        ) : null}

        {noStoresInRange ? (
          <div className="mx-auto max-w-lg space-y-3">
            <div className={cn(softCard, 'px-3 py-2.5')}>
              <DeliveryLocationControl variant="mobile" />
            </div>
            <NoStoresNearbyCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-6">
            <div className="space-y-3 lg:col-span-8 lg:space-y-4">
              {items.length > 0 ? (
                <CheckoutDeliveryAddress
                  ref={addressRef}
                  addresses={addresses}
                  selectedUuid={addressUuid}
                  onSelect={setAddressUuid}
                />
              ) : null}

              <section className={cn(softCard, 'p-4 lg:p-5')}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[15px] font-bold text-on-surface lg:text-base">
                    Items ({items.length})
                  </h2>
                  <div className="flex items-center gap-3">
                    {items.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClearOpen(true)}
                        className="text-xs font-bold text-error"
                      >
                        Clear
                      </button>
                    ) : null}
                    <Link to="/buyer" className="text-xs font-bold text-primary">
                      Add more
                    </Link>
                  </div>
                </div>

                {clearCart.isError ? (
                  <p className="mb-3 text-sm text-error">
                    {getApiErrorMessage(clearCart.error, 'Failed to clear cart')}
                  </p>
                ) : null}

                {isLoading ? (
                  <div className="space-y-2.5">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-container" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-10 text-center">
                    <span
                      className="material-symbols-outlined mb-3 text-5xl text-outline"
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      shopping_cart
                    </span>
                    <p className="text-sm text-on-surface-variant">Your cart is empty.</p>
                    <Link to="/buyer" className="mt-3 inline-block text-sm font-bold text-primary">
                      Browse the marketplace
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {items.map((item) => {
                      const product = item.product
                      const subtitle = productSubtitle(product)
                      return (
                        <div
                          key={item.uuid}
                          className="flex items-center gap-3 rounded-xl bg-surface-container-low/70 p-2.5 pr-3"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container lg:h-20 lg:w-20">
                            <ProductImage product={product} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-bold text-on-surface">
                                  {product?.name ?? 'Product'}
                                </h3>
                                {subtitle ? (
                                  <p className="truncate text-xs text-on-surface-variant">{subtitle}</p>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => setRemoveTarget(item)}
                                className="shrink-0 text-outline transition-colors active:text-error"
                                aria-label={`Remove ${product?.name ?? 'item'}`}
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(item.subtotal ?? (product?.price ?? 0) * item.quantity)}
                              </span>
                              <div className="flex items-center rounded-full bg-surface-container-lowest px-1 py-0.5 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQty.mutate({
                                      uuid: item.uuid,
                                      quantity: Math.max(1, item.quantity - 1),
                                    })
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-full active:scale-90"
                                >
                                  <span className="material-symbols-outlined text-[18px]">remove</span>
                                </button>
                                <span className="min-w-7 text-center text-sm font-bold">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQty.mutate({ uuid: item.uuid, quantity: item.quantity + 1 })
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary active:scale-90"
                                >
                                  <span className="material-symbols-outlined text-[18px]">add</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {items.length > 0 ? (
                <div className="space-y-3 lg:hidden">
                  <div className={cn(softCard, 'p-4')}>
                    <CheckoutCouponCard
                      variant="pill"
                      appliedCode={appliedCouponCode}
                      couponHint={couponHint}
                      availableCoupons={availableCoupons}
                      className="!gap-2"
                    />
                  </div>
                  <section className={cn(softCard, 'p-4')}>
                    <OrderSummaryCard
                      title="Bill details"
                      subtotal={subtotal}
                      delivery={delivery}
                      platformFee={platformFee}
                      discount={discount}
                      total={total}
                      itemCount={totals.itemCount}
                      couponCode={appliedCouponCode}
                      className="[&_h3]:mb-3 [&_h3]:text-[15px] [&_h3]:font-bold [&_.space-y-4]:space-y-2.5"
                    />
                  </section>
                </div>
              ) : null}
            </div>

            {items.length > 0 ? (
              <div className="hidden space-y-4 lg:col-span-4 lg:block">
                <div className={cn(softCard, 'p-5')}>
                  <CheckoutCouponCard
                    appliedCode={appliedCouponCode}
                    couponHint={couponHint}
                    availableCoupons={availableCoupons}
                    className="!rounded-none !bg-transparent !p-0 !shadow-none"
                  />
                </div>
                <section className={cn(softCard, 'sticky top-28 p-5')}>
                  <OrderSummaryCard
                    title="Bill details"
                    subtotal={subtotal}
                    delivery={delivery}
                    platformFee={platformFee}
                    discount={discount}
                    total={total}
                    itemCount={totals.itemCount}
                    couponCode={appliedCouponCode}
                  />
                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={handleProceed}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-on-primary transition-transform active:scale-[0.98] hover:brightness-110"
                    >
                      Proceed to Payment
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                    <p className="text-center text-xs text-outline">
                      {activeGateway
                        ? `Secure checkout powered by ${gatewayLabel(activeGateway)}`
                        : 'Secure encrypted checkout'}
                    </p>
                  </div>
                </section>
                <CheckoutFreshnessCard className="rounded-xl" />
              </div>
            ) : null}
          </div>
        )}
      </main>

      {items.length > 0 && !noStoresInRange ? (
        <div className="app-cta-safe fixed right-0 bottom-0 left-0 z-30 border-t border-outline-variant/40 bg-surface/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="shrink-0">
              <span className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">
                Total
              </span>
              <p className="text-lg font-bold leading-tight text-primary">{formatCurrency(total)}</p>
            </div>
            <button
              type="button"
              onClick={handleProceed}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98]"
            >
              {hasAddress ? 'Proceed to Payment' : 'Add address to continue'}
              <span className="material-symbols-outlined text-[20px]">
                {hasAddress ? 'payments' : 'location_on'}
              </span>
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmActionModal
        open={!!removeTarget}
        confirming={removeItem.isPending}
        onClose={() => {
          if (removeItem.isPending) return
          setRemoveTarget(null)
        }}
        onConfirm={() => {
          if (removeTarget) removeItem.mutate(removeTarget.uuid)
        }}
        message={
          <>
            Are you sure you want to remove{' '}
            <span className="font-bold text-primary">
              &apos;{removeTarget?.product?.name ?? 'this item'}&apos;
            </span>{' '}
            from your cart?
          </>
        }
        description="You can add it back anytime from the marketplace."
      />

      <ConfirmActionModal
        open={confirmClearOpen}
        confirming={clearCart.isPending}
        icon="delete_sweep"
        onClose={() => {
          if (clearCart.isPending) return
          setConfirmClearOpen(false)
        }}
        onConfirm={() => clearCart.mutate()}
        message="Are you sure you want to clear all items from your cart?"
        description="This action cannot be undone instantly, but you can always re-add items later."
      />
    </div>
  )
}
