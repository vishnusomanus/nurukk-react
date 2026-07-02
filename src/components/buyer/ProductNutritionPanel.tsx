import type { ProductNutrition } from '@/utils/productNutrition'
import { buildBuyerNutritionStats, formatBuyerNutritionHeading } from '@/utils/productNutrition'
import { cn } from '@/utils/cn'

type ProductNutritionPanelProps = {
  nutrition?: ProductNutrition | null
  quantity: number
  className?: string
}

export function ProductNutritionPanel({ nutrition, quantity, className }: ProductNutritionPanelProps) {
  const stats = buildBuyerNutritionStats(nutrition, quantity)
  if (stats.length === 0) return null

  const heading = formatBuyerNutritionHeading(quantity)

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-headline-lg-mobile lg:text-headline-lg">{heading}</h2>
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-container p-4 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center rounded-lg bg-white p-3 shadow-sm"
          >
            <span className="text-headline-lg font-bold text-primary">{stat.value}</span>
            <span className="text-label-md text-on-surface-variant">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
