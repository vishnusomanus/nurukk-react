import { lazy } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import {
  APP_ROLE,
  getAppLoginPath,
  isMultiPortalApp,
} from '@/config/appRole'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RootLayout } from '@/routes/RootLayout'
import { wrap } from '@/routes/wrap'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const OtpPage = lazy(() => import('@/pages/OtpPage').then((m) => ({ default: m.OtpPage })))
const TermsPage = lazy(() => import('@/pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() =>
  import('@/pages/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)

const role = import.meta.env.VITE_APP_ROLE ?? 'all'

const authRoutes: RouteObject[] = [
  { index: true, element: wrap(<HomePage />) },
  {
    path: '/login',
    element: <Navigate to={isMultiPortalApp ? '/' : getAppLoginPath(APP_ROLE)} replace />,
  },
  {
    path: '/register',
    element: <Navigate to={isMultiPortalApp ? '/' : getAppLoginPath(APP_ROLE)} replace />,
  },
  { path: '/otp', element: wrap(<OtpPage />) },
  { path: '/terms', element: wrap(<TermsPage />) },
  { path: '/privacy', element: wrap(<PrivacyPage />) },
]

const protectedChildren: RouteObject[] = []

if (role === 'all' || role === 'buyer') {
  const buyer = await import('./roleRoutes/buyer')
  authRoutes.push(...buyer.buyerAuthRoutes)
  protectedChildren.push(...buyer.buyerProtectedRoutes)
}

if (role === 'all' || role === 'seller') {
  const seller = await import('./roleRoutes/seller')
  authRoutes.push(...seller.sellerAuthRoutes)
  protectedChildren.push(...seller.sellerProtectedRoutes)
}

if (role === 'all' || role === 'delivery') {
  const delivery = await import('./roleRoutes/delivery')
  authRoutes.push(...delivery.deliveryAuthRoutes)
  protectedChildren.push(...delivery.deliveryProtectedRoutes)
}

if (role === 'all') {
  const admin = await import('./roleRoutes/admin')
  authRoutes.push(...admin.adminAuthRoutes)
  protectedChildren.push(...admin.adminProtectedRoutes)
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        ...authRoutes,
        {
          element: <ProtectedRoute />,
          children: protectedChildren,
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: routerBasename },
)
