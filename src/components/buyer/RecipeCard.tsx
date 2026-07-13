import { Link } from 'react-router-dom'
import type { BuyerRecipe } from '@/api/services/buyerRecipesService'
import * as buyerRecipesService from '@/api/services/buyerRecipesService'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { cn } from '@/utils/cn'

type RecipeCardProps = {
  recipe: BuyerRecipe
  className?: string
  /** `feed` = discovery list cards; `rail` = home carousel */
  layout?: 'feed' | 'rail'
}

export function RecipeCard({ recipe, className, layout = 'feed' }: RecipeCardProps) {
  const cover = recipe.image_url
  const hasBundle = buyerRecipesService.recipeHasBundle(recipe)
  const minutes = buyerRecipesService.recipeTotalMinutes(recipe)
  const difficulty = buyerRecipesService.recipeDifficulty(recipe)
  const isRail = layout === 'rail'

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(15,40,20,0.06)]',
        isRail ? 'flex h-full flex-col' : '',
        className,
      )}
    >
      <Link to={`/buyer/recipes/${recipe.uuid}`} className="block flex-1">
        <div className={cn('relative bg-surface-container', isRail ? 'aspect-[4/3]' : 'aspect-[16/10]')}>
          {cover ? (
            <RemoteImage src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-outline">
              <span className="material-symbols-outlined text-4xl">restaurant_menu</span>
            </div>
          )}
          {hasBundle ? (
            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-1 text-[10px] font-bold tracking-wide text-on-secondary-container uppercase">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              Smart Bundle
            </div>
          ) : null}
          <span className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-lg">
            <span className="material-symbols-outlined text-[22px]">add</span>
          </span>
        </div>
        <div className={cn('p-3', isRail ? 'sm:p-3.5' : 'p-4')}>
          <h3
            className={cn(
              'font-bold text-on-surface',
              isRail ? 'line-clamp-2 text-[15px] leading-snug' : 'text-headline-lg-mobile',
            )}
          >
            {recipe.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-on-surface-variant sm:text-xs">
            {minutes > 0 ? (
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                {minutes} min
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">restaurant</span>
              {difficulty}
            </span>
            {recipe.avg_rating != null ? (
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">star</span>
                {recipe.avg_rating.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  )
}
