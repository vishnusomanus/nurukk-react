import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RoleRoute } from '@/routes/RoleRoute'
import { wrap } from '@/routes/wrap'

const DeliveryLoginPage = lazy(() =>
  import('@/pages/auth/DeliveryLoginPage').then((m) => ({ default: m.DeliveryLoginPage })),
)
const DeliveryRegisterPage = lazy(() =>
  import('@/pages/auth/DeliveryRegisterPage').then((m) => ({ default: m.DeliveryRegisterPage })),
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
  import('@/pages/delivery/DeliveryOnboardingPage').then((m) => ({
    default: m.DeliveryOnboardingPage,
  })),
)
const DeliverySupportPage = lazy(() =>
  import('@/pages/delivery/DeliverySupportPage').then((m) => ({ default: m.DeliverySupportPage })),
)
const DeliveryAccountPage = lazy(() =>
  import('@/pages/delivery/DeliveryAccountPage').then((m) => ({ default: m.DeliveryAccountPage })),
)
const NotificationsPage = lazy(() =>
  import('@/pages/common/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)

export const deliveryAuthRoutes: RouteObject[] = [
  { path: '/login/delivery', element: wrap(<DeliveryLoginPage />) },
  { path: '/register/delivery', element: wrap(<DeliveryRegisterPage />) },
]

export const deliveryProtectedRoutes: RouteObject[] = [
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
          { path: 'support', element: wrap(<DeliverySupportPage />) },
          { path: 'account', element: wrap(<DeliveryAccountPage />) },
          { path: 'notifications', element: wrap(<NotificationsPage />) },
        ],
      },
    ],
  },
]
