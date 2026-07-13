import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import * as sellerRecipesService from '@/api/services/sellerRecipesService'
import { uploadService } from '@/api/services'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { extractRows } from '@/utils/extractRows'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type FormIngredient = {
  key: string
  product_uuid: string
  product_name: string
  product_image?: string | null
  unit?: string | null
  unit_price: number
  quantity: number
  line_total: number
}

const softCard =
  'rounded-2xl bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:p-6 lg:shadow-none'

const fieldClass =
  'w-full rounded-xl border-none bg-surface-container-low px-3.5 py-3 text-[16px] text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary/20 lg:rounded-lg lg:border lg:border-outline-variant/40 lg:bg-surface lg:text-sm'

function Section({
  step,
  title,
  desktopTitle,
  icon,
  children,
  action,
  badge,
  className,
}: {
  step: number
  title: string
  desktopTitle?: string
  icon: string
  children: ReactNode
  action?: ReactNode
  badge?: ReactNode
  className?: string
}) {
  return (
    <section className={cn(softCard, className)}>
      {/* Mobile / tablet heading */}
      <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
        <h2 className="flex items-center gap-2 text-sm font-bold text-on-surface">
          <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {/* Desktop heading */}
      <div className="mb-5 hidden items-center justify-between gap-3 lg:flex">
        <h2 className="flex items-center gap-3 text-base font-bold text-on-surface">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
            {step}
          </span>
          {desktopTitle ?? title}
        </h2>
        <div className="flex items-center gap-2">
          {badge}
          {action}
        </div>
      </div>
      {children}
    </section>
  )
}

export function SellerRecipeFormPage() {
  const { uuid } = useParams()
  const isEdit = Boolean(uuid)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [prepTime, setPrepTime] = useState('15')
  const [cookTime, setCookTime] = useState('30')
  const [servings, setServings] = useState('4')
  const [steps, setSteps] = useState<sellerRecipesService.RecipeStep[]>([
    sellerRecipesService.emptyRecipeStep(),
  ])
  const [ingredients, setIngredients] = useState<FormIngredient[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [publish, setPublish] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: existing, isLoading: loadingRecipe } = useQuery({
    queryKey: ['seller', 'recipe', uuid],
    queryFn: () => sellerRecipesService.getRecipe(uuid!),
    enabled: isEdit,
  })

  const { data: productsData } = useQuery({
    queryKey: ['seller', 'products', 'recipe-picker'],
    queryFn: () => sellerService.listProducts({ page: 1, per_page: 50 }),
  })

  const products = extractRows(productsData?.data) as Array<{
    uuid: string
    name: string
    price?: number
    unit?: string
    image_url?: string | null
    images?: string[]
  }>

  useEffect(() => {
    const recipe = existing?.data
    if (!recipe) return
    setName(sellerRecipesService.recipeTitle(recipe))
    setDescription(recipe.description ?? '')
    setCoverImage(sellerRecipesService.recipeCoverUrl(recipe))
    setPrepTime(String(recipe.prep_time_minutes ?? 15))
    setCookTime(String(recipe.cook_time_minutes ?? 30))
    setServings(String(recipe.servings ?? 4))
    setSteps(sellerRecipesService.resolveSellerRecipeSteps(recipe))
    setIngredients(
      (recipe.ingredients ?? [])
        .map((item, index) => {
          const product = item.product
          const unitPrice = product?.price ?? 0
          const qty = Number(item.quantity) || 1
          return {
            key: `${product?.uuid ?? item.name}-${index}`,
            product_uuid: product?.uuid ?? '',
            product_name: product?.name ?? item.name,
            product_image: product?.image_url ?? product?.images?.[0] ?? null,
            unit: item.unit ?? product?.unit ?? 'unit',
            unit_price: unitPrice,
            quantity: qty,
            line_total: unitPrice * qty,
          }
        })
        .filter((item) => item.product_uuid),
    )
    setPublish(sellerRecipesService.isRecipePublished(recipe))
  }, [existing?.data])

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    const selected = new Set(ingredients.map((i) => i.product_uuid))
    return products
      .filter((p) => !selected.has(p.uuid))
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [ingredients, productSearch, products])

  const ingredientsTotal = useMemo(
    () => ingredients.reduce((sum, item) => sum + item.line_total, 0),
    [ingredients],
  )

  const saveMutation = useMutation({
    mutationFn: async (shouldPublish: boolean) => {
      const payload = sellerRecipesService.buildRecipePayload({
        title: name,
        description,
        imageUrl: coverImage,
        prepTime,
        cookTime,
        servings,
        steps,
        ingredients,
        publish: shouldPublish,
      })

      if (!payload.title) throw new Error('Recipe name is required')
      if (!sellerRecipesService.recipeHasStepContent(steps)) {
        throw new Error('Add at least one recipe step with a heading')
      }

      if (isEdit && uuid) {
        return sellerRecipesService.updateRecipe(uuid, payload)
      }
      return sellerRecipesService.createRecipe(payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller', 'recipes'] })
      if (uuid) void queryClient.invalidateQueries({ queryKey: ['seller', 'recipe', uuid] })
      navigate('/seller/recipes')
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Could not save recipe')),
  })

  const onCoverPick = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setFormError(null)
    try {
      const res = await uploadService.uploadImages([file])
      const url = res.data?.urls?.[0]
      if (!url) throw new Error('Upload failed')
      setCoverImage(url)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not upload cover image'))
    } finally {
      setUploading(false)
    }
  }

  const addIngredient = (product: (typeof products)[number]) => {
    const unitPrice = product.price ?? 0
    setIngredients((prev) => [
      ...prev,
      {
        key: `${product.uuid}-${Date.now()}`,
        product_uuid: product.uuid,
        product_name: product.name,
        product_image: product.image_url ?? product.images?.[0] ?? null,
        unit: product.unit ?? 'unit',
        unit_price: unitPrice,
        quantity: 1,
        line_total: unitPrice,
      },
    ])
    setProductSearch('')
  }

  const onSave = () => {
    setFormError(null)
    saveMutation.mutate(publish)
  }

  if (isEdit && loadingRecipe) {
    return (
      <SellerPageShell pathname={location.pathname} ctaPad>
        <p className="text-sm text-on-surface-variant">Loading recipe…</p>
      </SellerPageShell>
    )
  }

  return (
    <SellerPageShell pathname={location.pathname} ctaPad className="space-y-3 pb-28 lg:space-y-6">
      {/* Desktop title */}
      <div className="hidden lg:block">
        <Link
          to="/seller/recipes"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Recipes
        </Link>
        <h1 className="mt-2 text-headline-xl text-primary">
          {isEdit ? 'Edit Recipe' : 'Create New Recipe'}
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Add prep details, steps, and catalog ingredients.
        </p>
      </div>

      {formError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {formError}
        </p>
      ) : null}

      <Section step={1} title="Basics" desktopTitle="Basic Information" icon="edit_note">
        <div className="space-y-3 lg:space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-on-surface-variant">Recipe name</span>
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Heirloom Tomato Tart"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-on-surface-variant">Description</span>
            <textarea
              className={cn(fieldClass, 'min-h-[88px] resize-none lg:h-24')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary for buyers"
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-on-surface-variant">Cover photo</span>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 py-8 text-center active:bg-surface-container lg:rounded-2xl lg:border lg:border-dashed lg:border-outline-variant lg:bg-surface-container-low/50 lg:py-10">
              {coverImage ? (
                <div className="h-36 w-full overflow-hidden rounded-xl lg:h-40 lg:max-w-md">
                  <RemoteImage src={coverImage} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-primary lg:text-4xl">
                    add_photo_alternate
                  </span>
                  <p className="text-sm font-semibold text-on-surface lg:hidden">Tap to add photo</p>
                  <p className="hidden text-sm font-semibold text-on-surface lg:block">
                    Drop your recipe photo here
                  </p>
                  <p className="text-[11px] text-on-surface-variant lg:text-xs">
                    JPG or PNG · max 5MB
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => void onCoverPick(e.target.files?.[0] ?? null)}
              />
              {uploading ? <p className="text-xs text-primary">Uploading…</p> : null}
            </label>
          </div>
        </div>
      </Section>

      {/* Mobile/tablet: compact prep times; desktop: times + steps */}
      <Section step={2} title="Prep" desktopTitle="Preparation Details" icon="timer">
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          {(
            [
              { label: 'Prep', value: prepTime, set: setPrepTime },
              { label: 'Cook', value: cookTime, set: setCookTime },
              { label: 'Serves', value: servings, set: setServings },
            ] as const
          ).map((field) => (
            <label key={field.label} className="block space-y-1">
              <span className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">
                {field.label}
              </span>
              <input
                type="number"
                min={0}
                className={cn(fieldClass, 'text-center font-bold')}
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
              />
            </label>
          ))}
        </div>

        {/* Desktop: times + steps in one numbered section */}
        <div className="hidden lg:block">
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { label: 'Prep Time (Min)', icon: 'timer', value: prepTime, set: setPrepTime },
                { label: 'Cook Time (Min)', icon: 'oven_gen', value: cookTime, set: setCookTime },
                { label: 'Servings', icon: 'groups', value: servings, set: setServings },
              ] as const
            ).map((field) => (
              <label key={field.label} className="block space-y-1.5">
                <span className="text-xs font-semibold text-on-surface-variant">{field.label}</span>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    {field.icon}
                  </span>
                  <input
                    type="number"
                    min={0}
                    className={cn(fieldClass, 'pl-10')}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                  />
                </div>
              </label>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-on-surface-variant">Steps</p>
              <button
                type="button"
                onClick={() =>
                  setSteps((prev) => [...prev, sellerRecipesService.emptyRecipeStep()])
                }
                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Add Step
              </button>
            </div>
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-2 rounded-xl bg-surface-container-low/50 p-3 lg:bg-transparent lg:p-0"
              >
                <span className="mt-3 w-8 shrink-0 text-sm font-bold text-primary">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    className={fieldClass}
                    value={step.heading}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, heading: e.target.value } : s)),
                      )
                    }
                    placeholder={`Step ${index + 1} heading`}
                  />
                  <textarea
                    className={cn(fieldClass, 'h-20')}
                    value={step.content}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, content: e.target.value } : s)),
                      )
                    }
                    placeholder="Step details…"
                  />
                </div>
                <button
                  type="button"
                  className="mt-2 flex size-10 shrink-0 items-center justify-center rounded-full text-error hover:bg-error/10"
                  onClick={() =>
                    setSteps((prev) =>
                      prev.length === 1
                        ? [sellerRecipesService.emptyRecipeStep()]
                        : prev.filter((_, i) => i !== index),
                    )
                  }
                  aria-label="Remove step"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Mobile/tablet steps */}
      <div className="lg:hidden">
        <Section
          step={2}
          title="Steps"
          icon="format_list_numbered"
          action={
            <button
              type="button"
              onClick={() =>
                setSteps((prev) => [...prev, sellerRecipesService.emptyRecipeStep()])
              }
              className="text-xs font-bold text-primary"
            >
              + Add
            </button>
          }
        >
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="rounded-xl bg-surface-container-low p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary">Step {index + 1}</span>
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full text-error active:bg-error/10"
                    onClick={() =>
                      setSteps((prev) =>
                        prev.length === 1
                          ? [sellerRecipesService.emptyRecipeStep()]
                          : prev.filter((_, i) => i !== index),
                      )
                    }
                    aria-label="Remove step"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    className={fieldClass}
                    value={step.heading}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, heading: e.target.value } : s)),
                      )
                    }
                    placeholder="Heading"
                  />
                  <textarea
                    className={cn(fieldClass, 'min-h-[72px] resize-none')}
                    value={step.content}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, content: e.target.value } : s)),
                      )
                    }
                    placeholder="Details…"
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section
        step={3}
        title="Ingredients"
        desktopTitle="Ingredients & Bundling"
        icon="grocery"
        badge={
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary uppercase">
            Smart Bundle
          </span>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              className={cn(fieldClass, 'pl-10')}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search catalog products…"
            />
          </div>

          {productSearch.trim() && filteredProducts.length > 0 ? (
            <div className="overflow-hidden rounded-xl bg-surface-container-low lg:border lg:border-outline-variant/40 lg:bg-surface">
              {filteredProducts.map((product) => (
                <button
                  key={product.uuid}
                  type="button"
                  onClick={() => addIngredient(product)}
                  className="flex w-full items-center justify-between gap-3 border-b border-outline-variant/20 px-3 py-3 text-left last:border-0 active:bg-surface-container lg:hover:bg-surface-container-low"
                >
                  <span className="text-sm font-semibold text-on-surface">{product.name}</span>
                  <span className="text-xs text-on-surface-variant">
                    {formatCurrency(product.price ?? 0)}
                    {product.unit ? ` / ${product.unit}` : ''}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {ingredients.length === 0 ? (
            <p className="text-center text-xs text-on-surface-variant">
              Search and add products from your catalog.
            </p>
          ) : (
            <div className="space-y-2">
              {ingredients.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2.5 rounded-xl bg-surface-container-low px-2.5 py-2 lg:gap-3 lg:bg-surface-container-low/70 lg:px-3 lg:py-2.5"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-container lg:h-11 lg:w-11">
                    {item.product_image ? (
                      <RemoteImage
                        src={item.product_image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-[16px]">grocery</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-on-surface">
                      {item.product_name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant lg:text-xs">
                      {formatCurrency(item.unit_price)}
                      {item.unit ? ` / ${item.unit}` : ''}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0.25}
                    step={0.25}
                    className="h-9 w-14 rounded-lg bg-surface text-center text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 lg:w-16 lg:border lg:border-outline-variant/40"
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = Math.max(0.25, Number(e.target.value) || 1)
                      setIngredients((prev) =>
                        prev.map((row) =>
                          row.key === item.key
                            ? { ...row, quantity: qty, line_total: row.unit_price * qty }
                            : row,
                        ),
                      )
                    }}
                  />
                  <p className="hidden w-16 text-right text-sm font-bold text-on-surface lg:block">
                    {formatCurrency(item.line_total)}
                  </p>
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container lg:hover:text-error"
                    onClick={() =>
                      setIngredients((prev) => prev.filter((row) => row.key !== item.key))
                    }
                    aria-label="Remove ingredient"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {ingredients.length > 0 ? (
            <div className="hidden rounded-xl bg-primary/8 px-4 py-3 lg:block">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-primary">Total Ingredients Value</p>
                  <p className="text-xs text-on-surface-variant">Bundle Auto-Calculation</p>
                </div>
                <p className="text-lg font-bold text-primary">{formatCurrency(ingredientsTotal)}</p>
              </div>
            </div>
          ) : null}
        </div>
      </Section>

      <Section step={4} title="Visibility" desktopTitle="Visibility" icon="visibility">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-3 lg:px-4">
          <div>
            <p className="text-sm font-bold text-on-surface">Publish recipe</p>
            <p className="text-[11px] text-on-surface-variant lg:text-xs">
              Visible to buyers when on
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={publish}
            onClick={() => setPublish((v) => !v)}
            className={cn(
              'relative h-7 w-12 rounded-full transition-colors',
              publish ? 'bg-primary' : 'bg-outline-variant',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform',
                publish && 'translate-x-5',
              )}
            />
          </button>
        </div>
      </Section>

      {/* Mobile / tablet sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="button"
            onClick={() => navigate('/seller/recipes')}
            className="h-11 flex-1 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={saveMutation.isPending || uploading}
            onClick={onSave}
            className="h-11 flex-[1.4] rounded-xl bg-primary text-sm font-bold text-on-primary disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Saving…' : publish ? 'Save & publish' : 'Save draft'}
          </button>
        </div>
      </div>

      {/* Desktop footer */}
      <div className="hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-4 lg:block">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">
              Unsaved Progress
            </p>
            <p className="truncate text-sm font-semibold text-on-surface">
              {name.trim() || 'Untitled recipe'} ({publish ? 'Publish' : 'Draft'})
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => navigate('/seller/recipes')}
              className="rounded-full border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface-variant"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending || uploading}
              onClick={onSave}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60"
            >
              {saveMutation.isPending
                ? 'Saving…'
                : isEdit
                  ? 'Save Recipe'
                  : publish
                    ? 'Publish Recipe'
                    : 'Save Draft'}
            </button>
          </div>
        </div>
      </div>
    </SellerPageShell>
  )
}
