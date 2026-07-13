/**
 * Breadcrumb-style back targets: always climb the route hierarchy
 * instead of relying on browser history (`navigate(-1)`).
 */

function normalizePath(pathname: string) {
  const raw = pathname.split('?')[0]?.split('#')[0] ?? '/'
  if (raw.length > 1 && raw.endsWith('/')) return raw.slice(0, -1)
  return raw || '/'
}

function isAppInternalPath(path: string) {
  return (
    path.startsWith('/buyer') ||
    path.startsWith('/seller') ||
    path.startsWith('/delivery') ||
    path.startsWith('/admin') ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path === '/otp'
  )
}

/** Tab roots / section homes — no back control. */
export const NO_BACK = new Set([
  '/buyer',
  '/buyer/categories',
  '/buyer/orders',
  '/buyer/profile',
  '/seller',
  '/seller/products',
  '/seller/orders',
  '/seller/inventory',
  '/seller/profile',
  '/delivery',
  '/delivery/history',
  '/delivery/earnings',
  '/admin',
  '/admin/dashboard',
  '/login/buyer',
  '/login/seller',
  '/login/delivery',
  '/login/admin',
  '/register/buyer',
  '/register/seller',
  '/register/delivery',
])

/** Bottom-nav Home routes — hardware back should minimize the app. */
export const BOTTOM_NAV_HOME = new Set(['/buyer', '/seller', '/delivery'])

/**
 * Other bottom-nav destinations → navigate to that role's Home on hardware back.
 * Keys are exact tab roots; values are the Home path.
 */
export const BOTTOM_NAV_TO_HOME: Record<string, string> = {
  '/buyer/categories': '/buyer',
  '/buyer/orders': '/buyer',
  '/buyer/profile': '/buyer',
  '/seller/products': '/seller',
  '/seller/orders': '/seller',
  '/seller/inventory': '/seller',
  '/seller/profile': '/seller',
  '/delivery/history': '/delivery',
  '/delivery/earnings': '/delivery',
}

type ExplicitRule = {
  pattern: RegExp
  parent: string | ((match: RegExpMatchArray) => string)
}

const EXPLICIT: ExplicitRule[] = [
  // Buyer checkout / orders
  { pattern: /^\/buyer\/checkout\/payment$/, parent: '/buyer/checkout' },
  {
    pattern: /^\/buyer\/orders\/([^/]+)\/invoice$/,
    parent: (m) => `/buyer/orders/${m[1]}/success`,
  },
  { pattern: /^\/buyer\/orders\/([^/]+)\/success$/, parent: '/buyer/orders' },
  { pattern: /^\/buyer\/categories\/([^/]+)$/, parent: '/buyer/categories' },
  { pattern: /^\/buyer\/products\/([^/]+)$/, parent: '/buyer' },
  { pattern: /^\/buyer\/recipes\/([^/]+)$/, parent: '/buyer/recipes' },
  { pattern: /^\/buyer\/recipes$/, parent: '/buyer' },
  { pattern: /^\/buyer\/stores\/([^/]+)$/, parent: '/buyer' },
  { pattern: /^\/buyer\/search$/, parent: '/buyer' },
  { pattern: /^\/buyer\/checkout$/, parent: '/buyer' },
  { pattern: /^\/buyer\/profile\/personal$/, parent: '/buyer/profile' },
  { pattern: /^\/buyer\/addresses$/, parent: '/buyer/profile' },
  { pattern: /^\/buyer\/wishlist$/, parent: '/buyer/profile' },
  { pattern: /^\/buyer\/notifications$/, parent: '/buyer/profile' },

  // Seller — primary detail flows
  { pattern: /^\/seller\/orders\/([^/]+)$/, parent: '/seller/orders' },
  { pattern: /^\/seller\/products\/new$/, parent: '/seller/products' },
  { pattern: /^\/seller\/products\/([^/]+)\/edit$/, parent: '/seller/products' },
  { pattern: /^\/seller\/recipes\/new$/, parent: '/seller/recipes' },
  { pattern: /^\/seller\/recipes\/([^/]+)\/edit$/, parent: '/seller/recipes' },
  { pattern: /^\/seller\/profile\/edit$/, parent: '/seller/profile' },
  // Seller — secondary screens from Profile
  { pattern: /^\/seller\/recipes$/, parent: '/seller' },
  { pattern: /^\/seller\/coupons$/, parent: '/seller/profile' },
  { pattern: /^\/seller\/payouts$/, parent: '/seller/profile' },
  { pattern: /^\/seller\/delivery$/, parent: '/seller/profile' },
  { pattern: /^\/seller\/notifications$/, parent: '/seller/profile' },
  { pattern: /^\/seller\/onboarding$/, parent: '/login/seller' },

  // Delivery
  { pattern: /^\/delivery\/notifications$/, parent: '/delivery' },
  { pattern: /^\/delivery\/onboarding$/, parent: '/login/delivery' },

  // Admin
  { pattern: /^\/admin\/orders\/([^/]+)$/, parent: '/admin/orders' },
  { pattern: /^\/admin\/users\/([^/]+)$/, parent: '/admin/users' },
]

/**
 * Resolve the breadcrumb parent for a pathname.
 * Optional `from` (e.g. location.state.from) wins when it is an in-app path.
 */
export function resolveBreadcrumbBack(
  pathname: string,
  from?: string | null,
): string | null {
  const path = normalizePath(pathname)

  if (from) {
    const fromPath = normalizePath(from)
    if (isAppInternalPath(fromPath) && fromPath !== path) return fromPath
  }

  if (NO_BACK.has(path)) return null

  for (const rule of EXPLICIT) {
    const match = path.match(rule.pattern)
    if (!match) continue
    return typeof rule.parent === 'function' ? rule.parent(match) : rule.parent
  }

  // Generic climb: drop the last segment
  const slash = path.lastIndexOf('/')
  if (slash <= 0) return null
  const parent = path.slice(0, slash)
  return parent.length > 0 ? parent : null
}
