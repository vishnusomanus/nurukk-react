import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RoleRoute } from '@/routes/RoleRoute'
import { SellerLayout } from '@/layouts/SellerLayout'
import { wrap } from '@/routes/wrap'

const SellerLoginPage = lazy(() =>
  import('@/pages/auth/SellerLoginPage').then((m) => ({ default: m.SellerLoginPage })),
)
const SellerRegisterPage = lazy(() =>
  import('@/pages/auth/SellerRegisterPage').then((m) => ({ default: m.SellerRegisterPage })),
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
const SellerRecipesPage = lazy(() =>
  import('@/pages/seller/SellerRecipesPage').then((m) => ({ default: m.SellerRecipesPage })),
)
const SellerRecipeFormPage = lazy(() =>
  import('@/pages/seller/SellerRecipeFormPage').then((m) => ({ default: m.SellerRecipeFormPage })),
)
const SellerSupportPage = lazy(() =>
  import('@/pages/seller/SellerSupportPage').then((m) => ({ default: m.SellerSupportPage })),
)
const NotificationsPage = lazy(() =>
  import('@/pages/common/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)

export const sellerAuthRoutes: RouteObject[] = [
  { path: '/login/seller', element: wrap(<SellerLoginPage />) },
  { path: '/register/seller', element: wrap(<SellerRegisterPage />) },
]

export const sellerProtectedRoutes: RouteObject[] = [
  {
    element: <RoleRoute roles={['seller']} />,
    children: [
      {
        path: '/seller/onboarding',
        element: wrap(<SellerOnboardingPage />),
      },
      {
        path: '/seller',
        element: <SellerLayout />,
        children: [
          { index: true, element: wrap(<SellerDashboardPage />) },
          { path: 'products', element: wrap(<SellerProductsPage />) },
          { path: 'products/new', element: wrap(<SellerProductFormPage />) },
          { path: 'products/:uuid/edit', element: wrap(<SellerProductFormPage />) },
          { path: 'recipes', element: wrap(<SellerRecipesPage />) },
          { path: 'recipes/new', element: wrap(<SellerRecipeFormPage />) },
          { path: 'recipes/:uuid/edit', element: wrap(<SellerRecipeFormPage />) },
          { path: 'orders', element: wrap(<SellerOrdersPage />) },
          { path: 'orders/:uuid', element: wrap(<SellerOrderDetailPage />) },
          { path: 'coupons', element: wrap(<SellerCouponsPage />) },
          { path: 'payouts', element: wrap(<SellerPayoutsPage />) },
          { path: 'inventory', element: wrap(<SellerInventoryPage />) },
          { path: 'delivery', element: wrap(<SellerDeliveryPage />) },
          { path: 'profile', element: wrap(<SellerProfilePage />) },
          { path: 'profile/edit', element: wrap(<SellerEditProfilePage />) },
          { path: 'support', element: wrap(<SellerSupportPage />) },
          { path: 'notifications', element: wrap(<NotificationsPage />) },
        ],
      },
    ],
  },
]
