import { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleRoute } from '@/routes/RoleRoute'
import { RootLayout } from '@/routes/RootLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { BuyerLayout } from '@/layouts/BuyerLayout'
import { SellerLayout } from '@/layouts/SellerLayout'
import { PageLoader } from '@/components/common/PageLoader'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const AdminLoginPage = lazy(() =>
  import('@/pages/auth/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
)
const BuyerLoginPage = lazy(() =>
  import('@/pages/auth/BuyerLoginPage').then((m) => ({ default: m.BuyerLoginPage })),
)
const SellerLoginPage = lazy(() =>
  import('@/pages/auth/SellerLoginPage').then((m) => ({ default: m.SellerLoginPage })),
)
const DeliveryLoginPage = lazy(() =>
  import('@/pages/auth/DeliveryLoginPage').then((m) => ({ default: m.DeliveryLoginPage })),
)
const DeliveryRegisterPage = lazy(() =>
  import('@/pages/auth/DeliveryRegisterPage').then((m) => ({ default: m.DeliveryRegisterPage })),
)
const BuyerRegisterPage = lazy(() =>
  import('@/pages/auth/BuyerRegisterPage').then((m) => ({ default: m.BuyerRegisterPage })),
)
const SellerRegisterPage = lazy(() =>
  import('@/pages/auth/SellerRegisterPage').then((m) => ({ default: m.SellerRegisterPage })),
)
const OtpPage = lazy(() => import('@/pages/OtpPage').then((m) => ({ default: m.OtpPage })))

const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminSellerVerificationPage = lazy(() =>
  import('@/pages/admin/AdminSellerVerificationPage').then((m) => ({
    default: m.AdminSellerVerificationPage,
  })),
)
const AdminCatalogPage = lazy(() =>
  import('@/pages/admin/AdminCatalogPage').then((m) => ({ default: m.AdminCatalogPage })),
)
const AdminCategoriesPage = lazy(() =>
  import('@/pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })),
)
const AdminProductTagsPage = lazy(() =>
  import('@/pages/admin/AdminProductTagsPage').then((m) => ({ default: m.AdminProductTagsPage })),
)
const UsersPage = lazy(() =>
  import('@/pages/admin/UsersPage').then((m) => ({ default: m.UsersPage })),
)
const AdminUserDetailPage = lazy(() =>
  import('@/pages/admin/AdminUserDetailPage').then((m) => ({ default: m.AdminUserDetailPage })),
)
const CouponsPage = lazy(() =>
  import('@/pages/admin/CouponsPage').then((m) => ({ default: m.CouponsPage })),
)
const OrdersPage = lazy(() =>
  import('@/pages/admin/OrdersPage').then((m) => ({ default: m.OrdersPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
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

const SellerDashboardPage = lazy(() =>
  import('@/pages/seller/SellerDashboardPage').then((m) => ({ default: m.SellerDashboardPage })),
)
const SellerProductsPage = lazy(() =>
  import('@/pages/seller/SellerProductsPage').then((m) => ({ default: m.SellerProductsPage })),
)
const SellerOrdersPage = lazy(() =>
  import('@/pages/seller/SellerOrdersPage').then((m) => ({ default: m.SellerOrdersPage })),
)
const SellerProductFormPage = lazy(() =>
  import('@/pages/seller/SellerProductFormPage').then((m) => ({ default: m.SellerProductFormPage })),
)
const SellerOrderDetailPage = lazy(() =>
  import('@/pages/seller/SellerOrderDetailPage').then((m) => ({ default: m.SellerOrderDetailPage })),
)
const SellerInventoryPage = lazy(() =>
  import('@/pages/seller/SellerInventoryPage').then((m) => ({ default: m.SellerInventoryPage })),
)
const SellerProfilePage = lazy(() =>
  import('@/pages/seller/SellerProfilePage').then((m) => ({ default: m.SellerProfilePage })),
)
const SellerPayoutsPage = lazy(() =>
  import('@/pages/seller/SellerPayoutsPage').then((m) => ({ default: m.SellerPayoutsPage })),
)
const SellerCouponsPage = lazy(() =>
  import('@/pages/seller/SellerCouponsPage').then((m) => ({ default: m.SellerCouponsPage })),
)
const SellerEditProfilePage = lazy(() =>
  import('@/pages/seller/SellerEditProfilePage').then((m) => ({ default: m.SellerEditProfilePage })),
)
const SellerOnboardingPage = lazy(() =>
  import('@/pages/seller/SellerOnboardingPage').then((m) => ({ default: m.SellerOnboardingPage })),
)
const SellerDeliveryPage = lazy(() =>
  import('@/pages/seller/SellerDeliveryPage').then((m) => ({ default: m.SellerDeliveryPage })),
)
const AdminMerchandisingPage = lazy(() =>
  import('@/pages/admin/AdminMerchandisingPage').then((m) => ({ default: m.AdminMerchandisingPage })),
)
const AdminAuditLogsPage = lazy(() =>
  import('@/pages/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage })),
)
const AdminRefundsPage = lazy(() =>
  import('@/pages/admin/AdminRefundsPage').then((m) => ({ default: m.AdminRefundsPage })),
)
const AdminPayoutsPage = lazy(() =>
  import('@/pages/admin/AdminPayoutsPage').then((m) => ({ default: m.AdminPayoutsPage })),
)
const AdminOrderDetailPage = lazy(() =>
  import('@/pages/admin/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage })),
)
const DeliveryLayout = lazy(() =>
  import('@/layouts/DeliveryLayout').then((m) => ({ default: m.DeliveryLayout })),
)
const DeliveryOrdersPage = lazy(() =>
  import('@/pages/delivery/DeliveryOrdersPage').then((m) => ({ default: m.DeliveryOrdersPage })),
)
const DeliveryHistoryPage = lazy(() =>
  import('@/pages/delivery/DeliveryHistoryPage').then((m) => ({ default: m.DeliveryHistoryPage })),
)
const DeliveryEarningsPage = lazy(() =>
  import('@/pages/delivery/DeliveryEarningsPage').then((m) => ({ default: m.DeliveryEarningsPage })),
)
const DeliveryOnboardingPage = lazy(() =>
  import('@/pages/delivery/DeliveryOnboardingPage').then((m) => ({ default: m.DeliveryOnboardingPage })),
)

function wrap(el: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{el}</Suspense>
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export const router = createBrowserRouter(
  [
  {
    element: <RootLayout />,
    children: [
      { index: true, element: wrap(<HomePage />) },
      { path: '/login', element: <Navigate to="/" replace /> },
      { path: '/login/admin', element: wrap(<AdminLoginPage />) },
      { path: '/login/buyer', element: wrap(<BuyerLoginPage />) },
      { path: '/login/seller', element: wrap(<SellerLoginPage />) },
      { path: '/login/delivery', element: wrap(<DeliveryLoginPage />) },
      { path: '/register', element: <Navigate to="/" replace /> },
      { path: '/register/buyer', element: wrap(<BuyerRegisterPage />) },
      { path: '/register/seller', element: wrap(<SellerRegisterPage />) },
      { path: '/register/delivery', element: wrap(<DeliveryRegisterPage />) },
      { path: '/otp', element: wrap(<OtpPage />) },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute roles={['admin', 'staff']} />,
            children: [
              {
                path: '/admin',
                element: <AdminLayout />,
                children: [
                  { index: true, element: wrap(<AdminDashboardPage />) },
                  { path: 'sellers', element: wrap(<AdminSellerVerificationPage />) },
                  { path: 'catalog', element: wrap(<AdminCatalogPage />) },
                  { path: 'categories', element: wrap(<AdminCategoriesPage />) },
                  { path: 'tags', element: wrap(<AdminProductTagsPage />) },
                  { path: 'merchandising', element: wrap(<AdminMerchandisingPage />) },
                  { path: 'users', element: wrap(<UsersPage />) },
                  { path: 'users/:uuid', element: wrap(<AdminUserDetailPage />) },
                  { path: 'coupons', element: wrap(<CouponsPage />) },
                  { path: 'orders', element: wrap(<OrdersPage />) },
                  { path: 'orders/:uuid', element: wrap(<AdminOrderDetailPage />) },
                  { path: 'audit-logs', element: wrap(<AdminAuditLogsPage />) },
                  { path: 'refunds', element: wrap(<AdminRefundsPage />) },
                  { path: 'payouts', element: wrap(<AdminPayoutsPage />) },
                  { path: 'settings', element: wrap(<SettingsPage />) },
                  { path: 'notifications', element: wrap(<NotificationsPage />) },
                ],
              },
            ],
          },
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
          {
            element: <RoleRoute roles={['seller']} />,
            children: [
              {
                path: '/seller',
                element: <SellerLayout />,
                children: [
                  { index: true, element: wrap(<SellerDashboardPage />) },
                  { path: 'products', element: wrap(<SellerProductsPage />) },
                  { path: 'products/new', element: wrap(<SellerProductFormPage />) },
                  { path: 'products/:uuid/edit', element: wrap(<SellerProductFormPage />) },
                  { path: 'orders', element: wrap(<SellerOrdersPage />) },
                  { path: 'orders/:uuid', element: wrap(<SellerOrderDetailPage />) },
                  { path: 'coupons', element: wrap(<SellerCouponsPage />) },
                  { path: 'payouts', element: wrap(<SellerPayoutsPage />) },
                  { path: 'inventory', element: wrap(<SellerInventoryPage />) },
                  { path: 'delivery', element: wrap(<SellerDeliveryPage />) },
                  { path: 'profile', element: wrap(<SellerProfilePage />) },
                  { path: 'profile/edit', element: wrap(<SellerEditProfilePage />) },
                  { path: 'onboarding', element: wrap(<SellerOnboardingPage />) },
                  { path: 'notifications', element: wrap(<NotificationsPage />) },
                ],
              },
            ],
          },
          {
            path: '/delivery/onboarding',
            element: wrap(<DeliveryOnboardingPage />),
          },
          {
            element: <RoleRoute roles={['delivery_agent', 'seller_delivery']} />,
            children: [
              {
                path: '/delivery',
                element: wrap(<DeliveryLayout />),
                children: [
                  { index: true, element: wrap(<DeliveryOrdersPage />) },
                  { path: 'history', element: wrap(<DeliveryHistoryPage />) },
                  { path: 'earnings', element: wrap(<DeliveryEarningsPage />) },
                  { path: 'notifications', element: wrap(<NotificationsPage />) },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
  ],
  { basename: routerBasename },
)
