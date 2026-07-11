import { Outlet } from 'react-router-dom'
import { BuyerBottomNav } from '@/components/buyer/BuyerBottomNav'
import { BuyerDesktopHeader } from '@/components/buyer/BuyerDesktopHeader'
import { BuyerFooter } from '@/components/buyer/BuyerFooter'
import { CartFlyLayer } from '@/components/buyer/CartFlyLayer'
import { CartAddProvider } from '@/context/CartAddProvider'
import { DeliveryLocationProvider } from '@/context/DeliveryLocationProvider'

export function BuyerMarketplaceLayout() {
  return (
    <CartAddProvider>
      <DeliveryLocationProvider>
        <div className="stitch-marketplace flex min-h-dvh w-full flex-col overflow-x-clip">
          <BuyerDesktopHeader />
          <div className="mx-auto w-full max-w-lg flex-1 overflow-x-clip lg:max-w-none">
            <Outlet />
          </div>
          <BuyerFooter />
          <BuyerBottomNav />
          <CartFlyLayer />
        </div>
      </DeliveryLocationProvider>
    </CartAddProvider>
  )
}
