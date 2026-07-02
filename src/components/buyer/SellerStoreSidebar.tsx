import type { BuyerCategory } from '@/api/services/buyerService'
import { getCategoryNavIcon } from '@/utils/categoryNav'
import { cn } from '@/utils/cn'

export function SellerStoreSidebar({
  categories,
  activeCategoryUuid,
  onCategoryChange,
  storeName,
  className,
}: {
  categories: BuyerCategory[]
  activeCategoryUuid: string | null
  onCategoryChange: (uuid: string | null) => void
  storeName?: string
  className?: string
}) {
  return (
    <aside className={cn('w-full shrink-0 md:w-64', className)}>
      <div className="sticky top-28 space-y-8">
        <div>
          <h3 className="text-headline-lg mb-4 text-primary">Categories</h3>
          <p className="text-body-md mb-6 text-on-surface-variant">
            {storeName ? `${storeName} selection` : 'Farm Fresh Selection'}
          </p>
          <nav className="hidden flex-col gap-1 md:flex">
            <button
              type="button"
              onClick={() => onCategoryChange(null)}
              className={cn(
                'flex items-center gap-4 rounded-lg px-4 py-2 text-left transition-all active:scale-[0.98]',
                activeCategoryUuid === null
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              <span className="material-symbols-outlined">grid_view</span>
              <span className="text-label-md">All Vegetables</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.uuid}
                type="button"
                onClick={() => onCategoryChange(category.uuid)}
                className={cn(
                  'flex items-center gap-4 rounded-lg px-4 py-2 text-left transition-all active:scale-[0.98]',
                  activeCategoryUuid === category.uuid
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high',
                )}
              >
                <span className="material-symbols-outlined">
                  {getCategoryNavIcon(category.name, category.slug)}
                </span>
                <span className="text-label-md">{category.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="rounded-xl border border-tertiary-container/20 bg-tertiary-container/10 p-6">
          <h4 className="mb-2 font-bold text-tertiary">Farm Delivery</h4>
          <p className="text-body-md mb-4 text-on-surface-variant">
            Same-day slots when ordering from this farm store.
          </p>
          <span className="text-body-md flex items-center gap-1 font-bold text-tertiary">
            View Schedule
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </span>
        </div>
      </div>
    </aside>
  )
}

export function SellerStoreCategoryChips({
  categories,
  activeCategoryUuid,
  onCategoryChange,
}: {
  categories: BuyerCategory[]
  activeCategoryUuid: string | null
  onCategoryChange: (uuid: string | null) => void
}) {
  return (
    <div className="stitch-hide-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
      <button
        type="button"
        onClick={() => onCategoryChange(null)}
        className={cn(
          'shrink-0 rounded-full px-4 py-2 text-body-md font-semibold transition-colors',
          activeCategoryUuid === null
            ? 'bg-primary text-on-primary'
            : 'border border-outline-variant bg-surface text-on-surface-variant',
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.uuid}
          type="button"
          onClick={() => onCategoryChange(category.uuid)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-body-md font-semibold transition-colors',
            activeCategoryUuid === category.uuid
              ? 'bg-primary text-on-primary'
              : 'border border-outline-variant bg-surface text-on-surface-variant',
          )}
        >
          <span className="material-symbols-outlined text-[18px]">
            {getCategoryNavIcon(category.name, category.slug)}
          </span>
          {category.name}
        </button>
      ))}
    </div>
  )
}
