import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyerService, paymentService } from '@/api/services'
import type { BuyerProduct, CartItem } from '@/api/services/buyerService'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { CheckoutCouponCard } from '@/components/buyer/CheckoutCouponCard'
import { CheckoutDeliveryAddress } from '@/components/buyer/CheckoutDeliveryAddress'
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

function productSubtitle(product?: BuyerProduct) {
  const parts: string[] = []
  if (product?.category?.name) parts.push(product.category.name)
  if (product?.unit) parts.push(product.unit)
  return parts.join(' • ')
}

export function CheckoutSummaryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addressUuid, addresses, hasAddress, setAddressUuid } = useCheckoutAddress()
  const { stored } = useDeliveryLocation()
  const noStoresInRange = Boolean(stored && !stored.serviceable)
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

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

  const handleProceed = () => navigate('/buyer/checkout/payment')

  const proceedButton = (className?: string) => (
    <button
      type="button"
      disabled={!hasAddress}
      onClick={handleProceed}
      className={
        className ??
        'flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-headline-lg-mobile font-bold text-on-primary shadow-lg transition-all active:scale-[0.98] hover:brightness-110 disabled:opacity-60 lg:text-headline-lg'
      }
    >
      Proceed to Payment
      <span className="material-symbols-outlined">arrow_forward</span>
    </button>
  )

  const cartItems = (
    <>
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-on-surface-variant">
          Your cart is empty.{' '}
          <Link to="/buyer" className="font-bold text-primary">
            Browse products
          </Link>
        </p>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          {items.map((item) => {
            const product = item.product
            const subtitle = productSubtitle(product)
            return (
              <div
                key={item.uuid}
                className="flex items-center gap-4 rounded-xl border border-transparent bg-surface-container-low p-4 transition-all hover:border-outline-variant lg:gap-6 lg:p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg lg:h-24 lg:w-24">
                  <ProductImage product={product} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-body-lg font-bold text-on-surface">{product?.name ?? 'Product'}</h3>
                      {subtitle ? (
                        <p className="text-label-md text-on-surface-variant">{subtitle}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(item)}
                      className="text-outline transition-colors hover:text-error active:scale-95"
                      aria-label={`Remove ${product?.name ?? 'item'}`}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-price-display text-primary">
                      {formatCurrency(item.subtotal ?? (product?.price ?? 0) * item.quantity)}
                    </span>
                    <div className="flex items-center rounded-full border border-outline-variant bg-surface-container-highest px-1 py-1">
                      <button
                        type="button"
                        onClick={() => updateQty.mutate({ uuid: item.uuid, quantity: Math.max(1, item.quantity - 1) })}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="px-4 text-body-md font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty.mutate({ uuid: item.uuid, quantity: item.quantity + 1 })}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm active:scale-90"
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
    </>
  )

  const billDetails = (
    <OrderSummaryCard
      title="Bill Details"
      subtotal={subtotal}
      delivery={delivery}
      platformFee={platformFee}
      discount={discount}
      total={total}
      itemCount={totals.itemCount}
      couponCode={appliedCouponCode}
    />
  )

  return (
    <div className="pb-32 lg:pb-8">
      <BuyerPageHeader title="Review Your Order" backTo="/buyer" />

      <main className="app-page-pad-top buyer-page-container pb-28 lg:pt-8 lg:pb-8">
        <h1 className="text-headline-xl mb-8 hidden text-on-surface lg:block">Review Your Order</h1>

        {error ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {getApiErrorMessage(error, 'Failed to load cart')}
          </p>
        ) : null}

        {noStoresInRange ? (
          <div className="mx-auto max-w-lg space-y-4">
            <div className="rounded-xl bg-surface-container-lowest px-3 py-2.5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
              <DeliveryLocationControl variant="mobile" />
            </div>
            <NoStoresNearbyCard />
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8 lg:space-y-8">
            <section className="lg:rounded-xl lg:bg-surface lg:p-6 lg:shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 lg:mb-6">
                <h2 className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">
                  Order Items ({items.length})
                </h2>
                <div className="flex items-center gap-3">
                  {items.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClearOpen(true)}
                      className="text-label-md flex items-center gap-1 font-bold text-error hover:underline"
                    >
                      <span className="material-symbols-outlined text-base">delete_sweep</span>
                      Clear cart
                    </button>
                  ) : null}
                  <Link to="/buyer" className="text-label-md font-bold text-primary hover:underline">
                    Add more items
                  </Link>
                </div>
              </div>
              {clearCart.isError ? (
                <p className="mb-4 text-sm text-error">
                  {getApiErrorMessage(clearCart.error, 'Failed to clear cart')}
                </p>
              ) : null}
              {cartItems}
            </section>

            {items.length > 0 ? (
              <CheckoutDeliveryAddress
                addresses={addresses}
                selectedUuid={addressUuid}
                onSelect={setAddressUuid}
              />
            ) : null}

            {items.length > 0 ? (
              <div className="space-y-6 lg:hidden">
                <CheckoutCouponCard
                  variant="pill"
                  appliedCode={appliedCouponCode}
                  couponHint={couponHint}
                  availableCoupons={availableCoupons}
                />
                <section className="rounded-2xl bg-surface-container-high p-6">
                  <OrderSummaryCard
                    title="Bill Details"
                    titleBorder
                    subtotal={subtotal}
                    delivery={delivery}
                    platformFee={platformFee}
                    discount={discount}
                    total={total}
                    itemCount={totals.itemCount}
                    couponCode={appliedCouponCode}
                  />
                </section>
              </div>
            ) : null}
          </div>

          {items.length > 0 ? (
            <div className="hidden space-y-6 lg:col-span-4 lg:block">
              <CheckoutCouponCard
                appliedCode={appliedCouponCode}
                couponHint={couponHint}
                availableCoupons={availableCoupons}
              />
              <section className="sticky top-28 rounded-xl bg-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
                {billDetails}
                <div className="mt-8 space-y-4">
                  {proceedButton()}
                  <p className="text-center text-label-md text-outline">
                    {activeGateway
                      ? `Secure checkout powered by ${gatewayLabel(activeGateway)}`
                      : 'Secure encrypted checkout'}
                  </p>
                </div>
              </section>
              <CheckoutFreshnessCard />
            </div>
          ) : null}
        </div>
          </>
        )}
      </main>

      {items.length > 0 && !noStoresInRange ? (
      <div className="app-cta-safe fixed right-0 bottom-0 left-0 z-30 border-t border-surface-variant bg-surface/95 px-margin-mobile py-4 backdrop-blur-lg lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-4">
            <div className="shrink-0">
              <span className="text-label-md uppercase text-on-surface-variant">Total</span>
              <p className="text-headline-lg font-bold text-primary">{formatCurrency(total)}</p>
            </div>
            <button
              type="button"
              disabled={!hasAddress}
              onClick={handleProceed}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-on-primary shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
            >
              Proceed to Payment
              <span className="material-symbols-outlined">payments</span>
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
