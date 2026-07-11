import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RoleRoute } from '@/routes/RoleRoute'
import { BuyerLayout } from '@/layouts/BuyerLayout'
import { wrap } from '@/routes/wrap'

const BuyerLoginPage = lazy(() =>
  import('@/pages/auth/BuyerLoginPage').then((m) => ({ default: m.BuyerLoginPage })),
)
const BuyerRegisterPage = lazy(() =>
  import('@/pages/auth/BuyerRegisterPage').then((m) => ({ default: m.BuyerRegisterPage })),
)
const BuyerHomePage = lazy(() =>
  import('@/pages/buyer/BuyerHomePage').then((m) => ({ default: m.BuyerHomePage })),
)
const BuyerCategoriesPage = lazy(() =>
  import('@/pages/buyer/BuyerCategoriesPage').then((m) => ({ default: m.BuyerCategoriesPage })),
)
const CategoryListingPage = lazy(() =>
  import('@/pages/buyer/CategoryListingPage').then((m) => ({ default: m.CategoryListingPage })),
)
const ProductDetailPage = lazy(() =>
  import('@/pages/buyer/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
)
const CheckoutSummaryPage = lazy(() =>
  import('@/pages/buyer/CheckoutSummaryPage').then((m) => ({ default: m.CheckoutSummaryPage })),
)
const PaymentSelectionPage = lazy(() =>
  import('@/pages/buyer/PaymentSelectionPage').then((m) => ({ default: m.PaymentSelectionPage })),
)
const OrderSuccessPage = lazy(() =>
  import('@/pages/buyer/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })),
)
const OrderInvoicePage = lazy(() =>
  import('@/pages/buyer/OrderInvoicePage').then((m) => ({ default: m.OrderInvoicePage })),
)
const BuyerProfilePage = lazy(() =>
  import('@/pages/buyer/BuyerProfilePage').then((m) => ({ default: m.BuyerProfilePage })),
)
const BuyerSearchPage = lazy(() =>
  import('@/pages/buyer/BuyerSearchPage').then((m) => ({ default: m.BuyerSearchPage })),
)
const BuyerOrdersPage = lazy(() =>
  import('@/pages/buyer/BuyerOrdersPage').then((m) => ({ default: m.BuyerOrdersPage })),
)
const BuyerAddressesPage = lazy(() =>
  import('@/pages/buyer/BuyerAddressesPage').then((m) => ({ default: m.BuyerAddressesPage })),
)
const BuyerPersonalInfoPage = lazy(() =>
  import('@/pages/buyer/BuyerPersonalInfoPage').then((m) => ({ default: m.BuyerPersonalInfoPage })),
)
const BuyerWishlistPage = lazy(() =>
  import('@/pages/buyer/BuyerWishlistPage').then((m) => ({ default: m.BuyerWishlistPage })),
)
const BuyerSellerStorePage = lazy(() =>
  import('@/pages/buyer/BuyerSellerStorePage').then((m) => ({ default: m.BuyerSellerStorePage })),
)
const NotificationsPage = lazy(() =>
  import('@/pages/common/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)

export const buyerAuthRoutes: RouteObject[] = [
  { path: '/login/buyer', element: wrap(<BuyerLoginPage />) },
  { path: '/register/buyer', element: wrap(<BuyerRegisterPage />) },
]

export const buyerProtectedRoutes: RouteObject[] = [
  {
    element: <RoleRoute roles={['buyer', 'customer']} />,
    children: [
      {
        path: '/buyer',
        element: <BuyerLayout />,
        children: [
          { index: true, element: wrap(<BuyerHomePage />) },
          { path: 'categories', element: wrap(<BuyerCategoriesPage />) },
          { path: 'categories/:categoryUuid', element: wrap(<CategoryListingPage />) },
          { path: 'products/:productUuid', element: wrap(<ProductDetailPage />) },
          { path: 'search', element: wrap(<BuyerSearchPage />) },
          { path: 'stores/:sellerUuid', element: wrap(<BuyerSellerStorePage />) },
          { path: 'checkout', element: wrap(<CheckoutSummaryPage />) },
          { path: 'checkout/payment', element: wrap(<PaymentSelectionPage />) },
          { path: 'orders/:orderUuid/success', element: wrap(<OrderSuccessPage />) },
          { path: 'orders/:orderUuid/invoice', element: wrap(<OrderInvoicePage />) },
          { path: 'orders', element: wrap(<BuyerOrdersPage />) },
          { path: 'addresses', element: wrap(<BuyerAddressesPage />) },
          { path: 'wishlist', element: wrap(<BuyerWishlistPage />) },
          { path: 'profile/personal', element: wrap(<BuyerPersonalInfoPage />) },
          { path: 'profile', element: wrap(<BuyerProfilePage />) },
          { path: 'notifications', element: wrap(<NotificationsPage />) },
        ],
      },
    ],
  },
]
