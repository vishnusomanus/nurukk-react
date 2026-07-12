import type { ProductNutrition } from '@/utils/productNutrition'
import { buildBuyerNutritionStats, formatBuyerNutritionHeading } from '@/utils/productNutrition'
import { cn } from '@/utils/cn'

type ProductNutritionPanelProps = {
  nutrition?: ProductNutrition | null
  quantity: number
  className?: string
}

const STAT_ICONS: Record<string, string> = {
  Calories: 'local_fire_department',
  Protein: 'egg',
  Fat: 'water_drop',
  Carbohydrates: 'bakery_dining',
  Fiber: 'grass',
  Sugar: 'icecream',
  Vitamins: 'pill',
  Iron: 'hardware',
}

export function ProductNutritionPanel({ nutrition, quantity, className }: ProductNutritionPanelProps) {
  const stats = buildBuyerNutritionStats(nutrition, quantity)
  if (stats.length === 0) return null

  const heading = formatBuyerNutritionHeading(quantity)
  const calories = stats.find((stat) => stat.label === 'Calories')
  const vitamins = stats.find((stat) => stat.label === 'Vitamins')
  const others = stats.filter((stat) => stat.label !== 'Calories' && stat.label !== 'Vitamins')

  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-primary/80 uppercase">
            Nutrition facts
          </p>
          <h2 className="text-lg font-bold tracking-tight text-on-surface sm:text-xl">{heading}</h2>
        </div>
        {quantity > 1 ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            ×{quantity}
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.07] via-surface to-secondary-container/20">
        {calories ? (
          <div className="flex items-center gap-4 border-b border-primary/10 px-4 py-4 sm:px-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[26px]">
                {STAT_ICONS.Calories}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-extrabold tracking-tight text-on-surface tabular-nums">
                {calories.value}
                <span className="ml-1 text-base font-semibold text-on-surface-variant">kcal</span>
              </p>
              <p className="text-sm text-on-surface-variant">Energy for selected quantity</p>
            </div>
          </div>
        ) : null}

        {others.length > 0 ? (
          <div className="grid grid-cols-3 gap-px bg-primary/10 sm:grid-cols-3">
            {others.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center gap-1 bg-surface/90 px-2 py-3.5 text-center backdrop-blur-sm sm:py-4"
              >
                <span className="material-symbols-outlined text-[18px] text-primary/80">
                  {STAT_ICONS[stat.label] ?? 'nutrition'}
                </span>
                <span className="text-base font-bold tracking-tight text-on-surface tabular-nums sm:text-lg">
                  {stat.value}
                </span>
                <span className="text-[10px] font-semibold tracking-wide text-on-surface-variant uppercase">
                  {stat.label === 'Carbohydrates' ? 'Carbs' : stat.label}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {vitamins ? (
          <div className="flex items-start gap-3 border-t border-primary/10 px-4 py-3.5 sm:px-5">
            <span className="material-symbols-outlined mt-0.5 text-[20px] text-primary">
              {STAT_ICONS.Vitamins}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                Vitamins
              </p>
              <p className="text-sm font-medium leading-snug text-on-surface">{vitamins.value}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
