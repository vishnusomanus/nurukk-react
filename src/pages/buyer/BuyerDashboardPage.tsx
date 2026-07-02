import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { buyerService } from '@/api/services'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { useAuthStore } from '@/store/authStore'

export function BuyerDashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'home'],
    queryFn: () => buyerService.getHome(),
  })

  const home = data?.data

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Buyer home</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-white/80">
            Welcome, <span className="font-medium text-zinc-900 dark:text-white">{user?.name ?? user?.phone}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketplace highlights</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-amber-700 dark:text-amber-200">
              {getApiErrorMessage(error, 'Failed to load home data')}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Categories', value: Array.isArray(home?.featured_categories) ? home.featured_categories.length : '—' },
                { label: 'Featured products', value: Array.isArray(home?.featured_products) ? home.featured_products.length : '—' },
                { label: 'Banners', value: Array.isArray(home?.banners) ? home.banners.length : '—' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-black/10 bg-zinc-50 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="text-xs text-zinc-600 dark:text-white/60">{item.label}</div>
                  <div className="mt-1 text-lg font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
