import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RoleRoute } from '@/routes/RoleRoute'
import { AdminLayout } from '@/layouts/AdminLayout'
import { wrap } from '@/routes/wrap'

const AdminLoginPage = lazy(() =>
  import('@/pages/auth/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
)
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
const AdminMerchandisingPage = lazy(() =>
  import('@/pages/admin/AdminMerchandisingPage').then((m) => ({ default: m.AdminMerchandisingPage })),
)
const AdminAuditLogsPage = lazy(() =>
  import('@/pages/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage })),
)
const AdminRefundsPage = lazy(() =>
  import('@/pages/admin/AdminRefundsPage').then((m) => ({ default: m.AdminRefundsPage })),
)
const AdminSupportPage = lazy(() =>
  import('@/pages/admin/AdminSupportPage').then((m) => ({ default: m.AdminSupportPage })),
)
const AdminSupportDetailPage = lazy(() =>
  import('@/pages/admin/AdminSupportDetailPage').then((m) => ({ default: m.AdminSupportDetailPage })),
)
const AdminPayoutsPage = lazy(() =>
  import('@/pages/admin/AdminPayoutsPage').then((m) => ({ default: m.AdminPayoutsPage })),
)
const AdminOrderDetailPage = lazy(() =>
  import('@/pages/admin/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage })),
)
const NotificationsPage = lazy(() =>
  import('@/pages/common/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)

export const adminAuthRoutes: RouteObject[] = [
  { path: '/login/admin', element: wrap(<AdminLoginPage />) },
]

export const adminProtectedRoutes: RouteObject[] = [
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
          { path: 'support', element: wrap(<AdminSupportPage />) },
          { path: 'support/:uuid', element: wrap(<AdminSupportDetailPage />) },
          { path: 'payouts', element: wrap(<AdminPayoutsPage />) },
          { path: 'settings', element: wrap(<SettingsPage />) },
          { path: 'notifications', element: wrap(<NotificationsPage />) },
        ],
      },
    ],
  },
]
