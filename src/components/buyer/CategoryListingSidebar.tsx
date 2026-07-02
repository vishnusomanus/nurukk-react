import { Link } from 'react-router-dom'
import type { BuyerCategory } from '@/api/services/buyerService'
import { getCategoryNavIcon } from '@/utils/categoryNav'
import { cn } from '@/utils/cn'

const PRICE_MAX = 500

export function CategoryListingSidebar({
  categories,
  activeCategoryUuid,
  maxPrice,
  onMaxPriceChange,
  organicOnly,
  onOrganicOnlyChange,
  locallySourcedOnly,
  onLocallySourcedOnlyChange,
  className,
}: {
  categories: BuyerCategory[]
  activeCategoryUuid?: string | null
  maxPrice: number
  onMaxPriceChange: (value: number) => void
  organicOnly: boolean
  onOrganicOnlyChange: (value: boolean) => void
  locallySourcedOnly: boolean
  onLocallySourcedOnlyChange: (value: boolean) => void
  className?: string
}) {
  const allActive = !activeCategoryUuid

  return (
    <aside
      className={cn(
        'sticky top-24 hidden h-fit w-64 flex-col gap-1 rounded-xl border-r border-outline-variant bg-surface-container-lowest p-4 md:flex',
        className,
      )}
    >
      <div className="mb-6">
        <h3 className="text-headline-lg text-primary">Categories</h3>
        <p className="text-label-md text-on-surface-variant">Farm Fresh Selection</p>
      </div>

      <nav className="mb-8 flex flex-col gap-1">
        <Link
          to="/buyer/categories"
          className={cn(
            'flex items-center gap-4 rounded-lg px-4 py-2 transition-all active:scale-[0.98]',
            allActive
              ? 'bg-primary-container text-on-primary-container'
              : 'text-on-surface-variant hover:bg-surface-container-high',
          )}
        >
          <span className="material-symbols-outlined">potted_plant</span>
          <span className="text-label-md">All Vegetables</span>
        </Link>

        {categories.map((category) => {
          const active = category.uuid === activeCategoryUuid
          return (
            <Link
              key={category.uuid}
              to={`/buyer/categories/${category.uuid}`}
              className={cn(
                'flex items-center gap-4 rounded-lg px-4 py-2 transition-all active:scale-[0.98]',
                active
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              <span className="material-symbols-outlined">
                {getCategoryNavIcon(category.name, category.slug)}
              </span>
              <span className="text-label-md">{category.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="space-y-8 border-t border-outline-variant pt-4">
        <div>
          <h4 className="text-label-md mb-4 tracking-wider text-primary uppercase">Price Range</h4>
          <input
            type="range"
            min={0}
            max={PRICE_MAX}
            step={10}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-container-high accent-primary"
          />
          <div className="mt-2 flex justify-between text-label-md text-on-surface-variant">
            <span>₹0</span>
            <span>{maxPrice >= PRICE_MAX ? '₹500+' : `₹${maxPrice}`}</span>
          </div>
        </div>

        <div>
          <h4 className="text-label-md mb-4 tracking-wider text-primary uppercase">Dietary</h4>
          <div className="space-y-3">
            <label className="group flex cursor-pointer items-center gap-4">
              <input
                type="checkbox"
                checked={organicOnly}
                onChange={(e) => onOrganicOnlyChange(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-body-md text-on-surface-variant transition-colors group-hover:text-primary">
                Organic
              </span>
            </label>
            <label className="group flex cursor-pointer items-center gap-4">
              <input
                type="checkbox"
                checked={locallySourcedOnly}
                onChange={(e) => onLocallySourcedOnlyChange(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-body-md text-on-surface-variant transition-colors group-hover:text-primary">
                Locally Sourced
              </span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  )
}
