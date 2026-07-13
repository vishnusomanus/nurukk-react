import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyerService, uploadService } from '@/api/services'
import * as sellerService from '@/api/services/sellerService'
import type { CreateProductPayload } from '@/api/services/sellerService'
import { ProductImageCropModal } from '@/components/seller/ProductImageCropModal'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import { getApiErrorMessage, getApiFieldErrorMap } from '@/utils/apiErrorMessage'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'
import { blobToFile, readFileAsObjectUrl } from '@/utils/cropImage'
import { applyNutritionToFormFields, buildNutritionPayload } from '@/utils/productNutrition'
import { ensureNativeMediaAccess } from '@/utils/ensureNativeMediaAccess'
import { getProductTagValues } from '@/utils/productListing'
import { cn } from '@/utils/cn'

type FormStep = 'basic' | 'images' | 'pricing' | 'inventory'

const STEPS: Array<{ id: FormStep; label: string; icon: string }> = [
  { id: 'basic', label: 'Basic Info', icon: 'info' },
  { id: 'images', label: 'Images', icon: 'image' },
  { id: 'pricing', label: 'Pricing', icon: 'payments' },
  { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
]

type ProductFormState = {
  name: string
  category_uuid: string
  description: string
  price: string
  discount_price: string
  unit: string
  stock: string
  tags: string[]
  imageUrls: string[]
  nutrition_calories: string
  nutrition_protein_g: string
  nutrition_fat_g: string
  nutrition_carbohydrates_g: string
  nutrition_fiber_g: string
  nutrition_sugar_g: string
  nutrition_vitamins: string
  nutrition_iron_mg: string
}

type FieldErrors = Partial<Record<keyof ProductFormState, string>>

const emptyForm: ProductFormState = {
  name: '',
  category_uuid: '',
  description: '',
  price: '',
  discount_price: '',
  unit: 'kg',
  stock: '',
  tags: [],
  imageUrls: ['', '', ''],
  nutrition_calories: '',
  nutrition_protein_g: '',
  nutrition_fat_g: '',
  nutrition_carbohydrates_g: '',
  nutrition_fiber_g: '',
  nutrition_sugar_g: '',
  nutrition_vitamins: '',
  nutrition_iron_mg: '',
}

const NUMERIC_NUTRITION_FIELDS = [
  'nutrition_calories',
  'nutrition_protein_g',
  'nutrition_fat_g',
  'nutrition_carbohydrates_g',
  'nutrition_fiber_g',
  'nutrition_sugar_g',
  'nutrition_iron_mg',
] as const

function validateProductForm(form: ProductFormState, isEdit: boolean): { errors: FieldErrors; step?: FormStep } {
  const errors: FieldErrors = {}

  if (!form.name.trim()) errors.name = 'Product name is required'

  if (!form.category_uuid) errors.category_uuid = 'Select a category'

  if (!form.price.trim()) {
    errors.price = 'Price is required'
  } else {
    const price = Number(form.price)
    if (Number.isNaN(price) || price < 0) errors.price = 'Enter a valid price'
  }

  if (form.discount_price.trim()) {
    const discount = Number(form.discount_price)
    const price = Number(form.price)
    if (Number.isNaN(discount) || discount < 0) {
      errors.discount_price = 'Enter a valid discount price'
    } else if (!Number.isNaN(price) && discount > price) {
      errors.discount_price = 'Discount must be less than or equal to price'
    }
  }

  if (!form.unit.trim()) errors.unit = 'Unit is required'

  if (!form.stock.trim()) {
    errors.stock = 'Stock quantity is required'
  } else {
    const stock = Number(form.stock)
    if (!Number.isInteger(stock) || stock < 0) errors.stock = 'Enter a whole number zero or greater'
  }

  for (const field of NUMERIC_NUTRITION_FIELDS) {
    if (form[field].trim() && Number.isNaN(Number(form[field]))) {
      errors[field] = 'Enter a valid number'
    }
  }

  let step: FormStep | undefined
  if (errors.name || errors.category_uuid) step = 'basic'
  else if (errors.price || errors.discount_price) step = 'pricing'
  else if (
    errors.unit ||
    errors.stock ||
    NUMERIC_NUTRITION_FIELDS.some((field) => errors[field])
  ) {
    step = 'inventory'
  }

  return { errors, step }
}

function mapServerFieldErrors(server: Record<string, string>): FieldErrors {
  const out: FieldErrors = {}
  for (const [key, message] of Object.entries(server)) {
    if (key in emptyForm) out[key as keyof ProductFormState] = message
  }
  return out
}

type CropQueueItem = {
  file: File
  previewUrl: string
  slotIndex: number
}

type CropSession = {
  items: CropQueueItem[]
  index: number
}

function fieldClass(hasError: boolean) {
  return cn(
    'w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-all focus:ring-2',
    hasError ? 'ring-2 ring-error/40 focus:ring-error' : 'focus:ring-primary/20',
  )
}

const softCard =
  'rounded-2xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block px-0.5 text-xs font-semibold text-on-surface-variant">{children}</span>
}

function resolveProductCategoryUuid(product: Record<string, unknown>): string {
  const direct = product.category_uuid
  if (typeof direct === 'string' && direct.trim()) return direct
  const category = product.category
  if (category && typeof category === 'object') {
    const uuid = (category as { uuid?: unknown }).uuid
    if (typeof uuid === 'string' && uuid.trim()) return uuid
  }
  return ''
}

export function SellerProductFormPage() {
  const location = useLocation()
  const { uuid } = useParams<{ uuid: string }>()
  const isEdit = Boolean(uuid)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<FormStep>('basic')
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cropSession, setCropSession] = useState<CropSession | null>(null)
  const [pendingFiles, setPendingFiles] = useState<Array<File | null>>([null, null, null])
  const [nutritionLookupQuery, setNutritionLookupQuery] = useState('')
  const [nutritionSourceNote, setNutritionSourceNote] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pickForSlotRef = useRef<number | null>(null)

  const currentCropItem = cropSession ? cropSession.items[cropSession.index] : null

  const revokeBlobPreview = (url: string) => {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  const { data: categoriesData } = useQuery({
    queryKey: ['buyer', 'categories'],
    queryFn: () => buyerService.listCategories(),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['buyer', 'product-tags'],
    queryFn: () => buyerService.listProductTags(),
    staleTime: 60_000,
  })

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['seller', 'products', uuid],
    queryFn: () => sellerService.getProduct(uuid!),
    enabled: isEdit,
  })

  useEffect(() => {
    const product = productData?.data
    if (!product) return

    const existingImages = (product.images ?? [])
      .map((url) => resolveApiAssetUrl(String(url)))
      .filter(Boolean)

    setForm({
      name: product.name ?? '',
      category_uuid: resolveProductCategoryUuid(product as Record<string, unknown>),
      description: product.description ?? '',
      price: product.price != null ? String(product.price) : '',
      discount_price: product.discount_price != null ? String(product.discount_price) : '',
      unit: product.unit ?? 'kg',
      stock: product.stock != null ? String(product.stock) : '',
      tags: getProductTagValues(product as Record<string, unknown>),
      imageUrls: [...existingImages, '', '', ''].slice(0, 3),
      ...applyNutritionToFormFields(product.nutrition ?? {}),
    })
    setPendingFiles([null, null, null])
  }, [productData])

  const categories = categoriesData?.data ?? []
  const tagOptions = tagsData?.data ?? []

  const { data: nutritionStatusData } = useQuery({
    queryKey: ['seller', 'nutrition', 'lookup-status'],
    queryFn: () => sellerService.getNutritionLookupStatus(),
    staleTime: 60_000,
  })

  const nutritionStatus = nutritionStatusData?.data
  const nutritionLookupAvailable = nutritionStatus?.available ?? false
  const openFoodFactsStatus = nutritionStatus?.open_food_facts

  const nutritionLookup = useMutation({
    mutationFn: (query: string) => sellerService.lookupProductNutrition(query),
    onSuccess: (response) => {
      const nutrition = response.data?.nutrition
      const source = response.data?.source
      if (!nutrition) return

      setForm((current) => ({
        ...current,
        ...applyNutritionToFormFields(nutrition),
      }))
      setNutritionSourceNote(
        source?.food_name
          ? `Filled from ${source.provider ?? 'Open Food Facts'}: ${source.food_name} (per 100g). Values are shown to buyers per kg — adjust if needed.`
          : null,
      )
      setFieldErrors((current) => {
        const next = { ...current }
        for (const field of NUMERIC_NUTRITION_FIELDS) delete next[field]
        return next
      })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'nutrition', 'lookup-status'] })
    },
  })

  useEffect(() => {
    if (step !== 'inventory' || nutritionLookupQuery.trim() || !form.name.trim()) return
    setNutritionLookupQuery(form.name.trim())
  }, [step, form.name, nutritionLookupQuery])

  const saveProduct = useMutation({
    mutationFn: async () => {
      const nutrition = buildNutritionPayload({
        calories: form.nutrition_calories,
        protein_g: form.nutrition_protein_g,
        fat_g: form.nutrition_fat_g,
        carbohydrates_g: form.nutrition_carbohydrates_g,
        fiber_g: form.nutrition_fiber_g,
        sugar_g: form.nutrition_sugar_g,
        vitamins: form.nutrition_vitamins,
        iron_mg: form.nutrition_iron_mg,
      })

      const payload: CreateProductPayload = {
        name: form.name.trim(),
        category_uuid: form.category_uuid,
        description: form.description.trim() || undefined,
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : undefined,
        unit: form.unit.trim(),
        stock: Number(form.stock),
        tags: form.tags,
        nutrition,
      }

      setUploadingImages(true)
      const images: string[] = []
      try {
        for (let i = 0; i < form.imageUrls.length; i++) {
          const pending = pendingFiles[i]
          if (pending) {
            const res = await uploadService.uploadImages([pending])
            const url = res.data?.urls?.[0]
            if (url) images.push(url)
            continue
          }

          const existing = form.imageUrls[i]?.trim()
          if (existing && !existing.startsWith('blob:')) {
            images.push(resolveApiAssetUrl(existing))
          }
        }
      } finally {
        setUploadingImages(false)
      }

      if (isEdit && uuid) {
        const updated = await sellerService.updateProduct(uuid, {
          name: payload.name,
          category_uuid: payload.category_uuid,
          description: payload.description ?? null,
          price: payload.price,
          discount_price: payload.discount_price ?? null,
          stock: payload.stock,
          tags: payload.tags ?? [],
          nutrition: payload.nutrition ?? null,
        })

        await sellerService.uploadProductImages(uuid, images)

        return updated
      }

      const created = await sellerService.createProduct(payload)
      const productUuid = created.data?.uuid

      if (productUuid) {
        await sellerService.uploadProductImages(productUuid, images)
      }

      return created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] })
      navigate('/seller/products')
    },
    onError: (error) => {
      const serverErrors = mapServerFieldErrors(getApiFieldErrorMap(error))
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors((current) => ({ ...current, ...serverErrors }))
        const { step: errorStep } = validateProductForm(form, isEdit)
        if (errorStep) setStep(errorStep)
      }
    },
  })

  const updateField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const toggleTag = (value: string) => {
    setForm((current) => {
      const selected = current.tags.includes(value)
        ? current.tags.filter((tag) => tag !== value)
        : [...current.tags, value]
      return { ...current, tags: selected }
    })
  }

  const removeImageAt = (index: number) => {
    setForm((current) => {
      const next = [...current.imageUrls]
      revokeBlobPreview(next[index] ?? '')
      next[index] = ''
      return { ...current, imageUrls: next }
    })
    setPendingFiles((current) => {
      const next = [...current]
      next[index] = null
      return next
    })
  }

  const closeCropSession = () => {
    setCropSession(null)
    pickForSlotRef.current = null
  }

  const startCropFlow = async (files: File[]) => {
    const preferredSlot = pickForSlotRef.current
    const slots: number[] = []

    if (preferredSlot != null && !form.imageUrls[preferredSlot]?.trim()) {
      slots.push(preferredSlot)
    }
    for (let i = 0; i < form.imageUrls.length && slots.length < files.length; i++) {
      if (!form.imageUrls[i]?.trim() && !slots.includes(i)) slots.push(i)
    }

    if (slots.length === 0) {
      setUploadError('All three image slots are full. Remove one to upload a new photo.')
      return
    }

    const selectedFiles = files.slice(0, slots.length)
    const items: CropQueueItem[] = []
    for (let i = 0; i < selectedFiles.length; i++) {
      items.push({
        file: selectedFiles[i],
        previewUrl: await readFileAsObjectUrl(selectedFiles[i]),
        slotIndex: slots[i],
      })
    }

    setCropSession({ items, index: 0 })
    setUploadError(null)
  }

  const openFilePicker = async (slotIndex?: number) => {
    const allowed = await ensureNativeMediaAccess()
    if (!allowed) {
      setUploadError('Camera or photo library permission is required to upload product images.')
      return
    }
    pickForSlotRef.current = slotIndex ?? null
    fileInputRef.current?.click()
  }

  const handleCropConfirm = async (blob: Blob) => {
    if (!cropSession) return
    const item = cropSession.items[cropSession.index]
    const file = blobToFile(blob, item.file.name)
    const previewUrl = URL.createObjectURL(blob)

    setForm((current) => {
      const next = [...current.imageUrls]
      revokeBlobPreview(next[item.slotIndex] ?? '')
      next[item.slotIndex] = previewUrl
      return { ...current, imageUrls: next }
    })
    setPendingFiles((current) => {
      const next = [...current]
      next[item.slotIndex] = file
      return next
    })

    const nextIndex = cropSession.index + 1
    if (nextIndex >= cropSession.items.length) {
      closeCropSession()
    } else {
      setCropSession({ ...cropSession, index: nextIndex })
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const { errors, step: errorStep } = validateProductForm(form, isEdit)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      if (errorStep) setStep(errorStep)
      return
    }
    saveProduct.mutate()
  }

  if (isEdit && productLoading) {
    return (
      <SellerPageShell pathname={location.pathname} ctaPad>
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      </SellerPageShell>
    )
  }

  const stepIndex = STEPS.findIndex((item) => item.id === step)
  const isLastStep = stepIndex === STEPS.length - 1
  const goToStep = (next: FormStep) => setStep(next)
  const goNext = () => {
    if (!isLastStep) goToStep(STEPS[stepIndex + 1].id)
  }
  const goPrev = () => {
    if (stepIndex > 0) goToStep(STEPS[stepIndex - 1].id)
  }

  return (
    <SellerPageShell pathname={location.pathname} ctaPad className="space-y-3 lg:space-y-5 !max-w-4xl">
      <div className="hidden lg:block">
        <h1 className="text-headline-xl text-primary">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {isEdit ? 'Update your farm-fresh listing.' : 'Create a new farm-fresh listing for the marketplace.'}
        </p>
      </div>

      <div className="stitch-hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
        {STEPS.map((item, index) => {
          const active = step === item.id
          const done = index < stepIndex
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goToStep(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors',
                active
                  ? 'bg-primary text-on-primary'
                  : done
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant shadow-[0_2px_12px_rgba(15,40,20,0.06)]',
              )}
            >
              <span className="material-symbols-outlined text-[16px]">{done && !active ? 'check' : item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>

      <form id="seller-product-form" className="space-y-3" onSubmit={handleSubmit} noValidate>
        <section className={cn(softCard, 'space-y-4 p-4 lg:p-6')}>
          {(step === 'basic' || step === 'pricing' || step === 'inventory') && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {step === 'basic' ? (
                <>
                  <label className="block sm:col-span-2">
                    <FieldLabel>Product name</FieldLabel>
                    <input
                      value={form.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      placeholder="e.g. Organic Baby Spinach"
                      className={fieldClass(Boolean(fieldErrors.name))}
                      aria-invalid={Boolean(fieldErrors.name)}
                    />
                    {fieldErrors.name ? <p className="mt-1 text-xs text-error">{fieldErrors.name}</p> : null}
                  </label>

                  <label className="block sm:col-span-2">
                    <FieldLabel>Category</FieldLabel>
                    <select
                      value={form.category_uuid}
                      onChange={(event) => updateField('category_uuid', event.target.value)}
                      className={fieldClass(Boolean(fieldErrors.category_uuid))}
                      aria-invalid={Boolean(fieldErrors.category_uuid)}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.uuid} value={category.uuid}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category_uuid ? (
                      <p className="mt-1 text-xs text-error">{fieldErrors.category_uuid}</p>
                    ) : null}
                  </label>

                  <label className="block sm:col-span-2">
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      value={form.description}
                      onChange={(event) => updateField('description', event.target.value)}
                      placeholder="Freshness, farm origin, and growing practices…"
                      rows={4}
                      className={cn(fieldClass(false), 'resize-none')}
                    />
                  </label>

                  <div className="sm:col-span-2">
                    <FieldLabel>Tags</FieldLabel>
                    {tagOptions.length === 0 ? (
                      <p className="text-xs text-on-surface-variant">No tags available yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tagOptions.map((tag) => {
                          const selected = form.tags.includes(tag.value)
                          return (
                            <button
                              key={tag.value}
                              type="button"
                              onClick={() => toggleTag(tag.value)}
                              className={cn(
                                'rounded-full px-3.5 py-2 text-xs font-bold transition-colors active:scale-[0.98]',
                                selected
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-surface-container-low text-on-surface-variant',
                              )}
                            >
                              {tag.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <p className="mt-1.5 text-[11px] text-on-surface-variant">
                      Optional. Used for filters on your products list and buyer browsing.
                    </p>
                  </div>
                </>
              ) : null}

              {step === 'pricing' ? (
                <>
                  <label className="block">
                    <FieldLabel>Price</FieldLabel>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold text-on-surface-variant">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={form.price}
                        onChange={(event) => updateField('price', event.target.value)}
                        className={cn(fieldClass(Boolean(fieldErrors.price)), 'pl-8 font-bold')}
                        aria-invalid={Boolean(fieldErrors.price)}
                      />
                    </div>
                    {fieldErrors.price ? <p className="mt-1 text-xs text-error">{fieldErrors.price}</p> : null}
                  </label>
                  <label className="block">
                    <FieldLabel>Discount price</FieldLabel>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold text-on-surface-variant">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={form.discount_price}
                        onChange={(event) => updateField('discount_price', event.target.value)}
                        className={cn(fieldClass(Boolean(fieldErrors.discount_price)), 'pl-8 font-bold')}
                        aria-invalid={Boolean(fieldErrors.discount_price)}
                      />
                    </div>
                    {fieldErrors.discount_price ? (
                      <p className="mt-1 text-xs text-error">{fieldErrors.discount_price}</p>
                    ) : null}
                  </label>
                </>
              ) : null}

              {step === 'inventory' ? (
                <>
                  <label className="block">
                    <FieldLabel>Unit</FieldLabel>
                    <input
                      value={form.unit}
                      onChange={(event) => updateField('unit', event.target.value)}
                      placeholder="kg, bunch, pack…"
                      className={fieldClass(Boolean(fieldErrors.unit))}
                      aria-invalid={Boolean(fieldErrors.unit)}
                    />
                    {fieldErrors.unit ? <p className="mt-1 text-xs text-error">{fieldErrors.unit}</p> : null}
                  </label>
                  <label className="block">
                    <FieldLabel>Stock quantity</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={form.stock}
                      onChange={(event) => updateField('stock', event.target.value)}
                      className={fieldClass(Boolean(fieldErrors.stock))}
                      aria-invalid={Boolean(fieldErrors.stock)}
                    />
                    {fieldErrors.stock ? <p className="mt-1 text-xs text-error">{fieldErrors.stock}</p> : null}
                  </label>

                  <div className="space-y-3 sm:col-span-2">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">Nutrition (per 100g)</h3>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        Optional. Auto-fill via{' '}
                        <a
                          href="https://world.openfoodfacts.org/"
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary"
                        >
                          Open Food Facts
                        </a>
                        . Shown to buyers per kg.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={nutritionLookupQuery}
                        onChange={(event) => setNutritionLookupQuery(event.target.value)}
                        placeholder={form.name.trim() || 'Search food name'}
                        disabled={!nutritionLookupAvailable || nutritionLookup.isPending}
                        className={cn(fieldClass(false), 'sm:flex-1')}
                      />
                      <button
                        type="button"
                        disabled={
                          !nutritionLookupAvailable ||
                          nutritionLookup.isPending ||
                          !(nutritionLookupQuery.trim() || form.name.trim())
                        }
                        onClick={() =>
                          nutritionLookup.mutate(nutritionLookupQuery.trim() || form.name.trim())
                        }
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-4 text-sm font-bold text-primary disabled:opacity-50 active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-[18px]">nutrition</span>
                        {nutritionLookup.isPending ? 'Looking up…' : 'Auto-fill'}
                      </button>
                    </div>

                    {!nutritionLookupAvailable ? (
                      <p className="rounded-xl bg-surface-container-high px-3 py-2 text-xs text-on-surface-variant">
                        {nutritionStatus?.reason ?? 'Nutrition auto-calculate is unavailable.'}
                      </p>
                    ) : openFoodFactsStatus?.monthly_limit ? (
                      <p className="text-xs text-on-surface-variant">
                        Lookups this month: {openFoodFactsStatus.requests_this_month ?? 0} /{' '}
                        {openFoodFactsStatus.monthly_limit}
                      </p>
                    ) : null}
                    {nutritionLookup.error ? (
                      <p className="text-xs text-error">
                        {getApiErrorMessage(nutritionLookup.error, 'Nutrition lookup failed')}
                      </p>
                    ) : null}
                    {nutritionSourceNote ? (
                      <p className="rounded-xl bg-primary/10 px-3 py-2 text-xs text-on-surface">{nutritionSourceNote}</p>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ['nutrition_calories', 'Calories'],
                          ['nutrition_protein_g', 'Protein (g)'],
                          ['nutrition_fat_g', 'Fat (g)'],
                          ['nutrition_carbohydrates_g', 'Carbs (g)'],
                          ['nutrition_fiber_g', 'Fiber (g)'],
                          ['nutrition_sugar_g', 'Sugar (g)'],
                          ['nutrition_iron_mg', 'Iron (mg)'],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="block">
                          <FieldLabel>{label}</FieldLabel>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            inputMode="decimal"
                            value={form[key]}
                            onChange={(event) => updateField(key, event.target.value)}
                            className={fieldClass(Boolean(fieldErrors[key]))}
                          />
                          {fieldErrors[key] ? (
                            <p className="mt-1 text-xs text-error">{fieldErrors[key]}</p>
                          ) : null}
                        </label>
                      ))}
                      <label className="col-span-2 block">
                        <FieldLabel>Vitamins</FieldLabel>
                        <input
                          value={form.nutrition_vitamins}
                          onChange={(event) => updateField('nutrition_vitamins', event.target.value)}
                          placeholder="e.g. A, C, K"
                          className={fieldClass(false)}
                        />
                      </label>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {step === 'images' ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-on-surface">Photos</h3>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Up to 3 photos. Crop before save — first image is the primary listing photo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openFilePicker()}
                disabled={Boolean(cropSession) || saveProduct.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary/10 px-4 text-sm font-bold text-primary disabled:opacity-50 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[20px]">upload</span>
                Upload & crop
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={Boolean(cropSession) || saveProduct.isPending}
                onChange={async (event) => {
                  const files = Array.from(event.target.files ?? [])
                  event.target.value = ''
                  if (files.length === 0) return
                  await startCropFlow(files)
                }}
              />
              {uploadError ? <p className="text-xs text-error">{uploadError}</p> : null}

              <div className="grid grid-cols-3 gap-2">
                {form.imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <div
                      role={url ? undefined : 'button'}
                      tabIndex={url ? undefined : 0}
                      onClick={url ? undefined : () => openFilePicker(index)}
                      onKeyDown={
                        url
                          ? undefined
                          : (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openFilePicker(index)
                              }
                            }
                      }
                      className={cn(
                        'flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-xl bg-surface-container',
                        url
                          ? ''
                          : 'cursor-pointer border border-dashed border-outline-variant active:bg-surface-container-high',
                      )}
                    >
                      {url ? (
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-2xl text-outline">add_a_photo</span>
                          <p className="px-1 text-center text-[10px] font-semibold text-on-surface-variant">
                            {index === 0 ? 'Primary' : 'Add'}
                          </p>
                        </>
                      )}
                    </div>
                    {url ? (
                      <>
                        {pendingFiles[index] ? (
                          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-on-primary">
                            Cropped
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeImageAt(index)}
                          className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-surface/95 text-on-surface shadow-sm active:bg-error-container active:text-error"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {saveProduct.error ? (
          <p className="rounded-2xl border border-error/20 bg-error-container px-3 py-2 text-sm text-error">
            {getApiErrorMessage(saveProduct.error, 'Failed to save product')}
          </p>
        ) : null}
      </form>

      <div className="app-cta-safe fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant/40 bg-surface/95 px-4 py-3 backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-lg items-center gap-3 lg:max-w-4xl">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goPrev}
              className="h-12 shrink-0 rounded-xl border border-outline-variant px-5 text-sm font-bold text-on-surface-variant active:bg-surface-container-low"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/seller/products')}
              className="h-12 shrink-0 rounded-xl border border-outline-variant px-5 text-sm font-bold text-on-surface-variant active:bg-surface-container-low"
            >
              Cancel
            </button>
          )}

          {isLastStep ? (
            <button
              type="submit"
              form="seller-product-form"
              disabled={saveProduct.isPending || uploadingImages}
              className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {saveProduct.isPending || uploadingImages
                ? 'Saving…'
                : isEdit
                  ? 'Save Changes'
                  : 'Publish Product'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98]"
            >
              Continue
            </button>
          )}
        </div>
      </div>

      <ProductImageCropModal
        open={Boolean(currentCropItem)}
        imageSrc={currentCropItem?.previewUrl ?? null}
        title={
          cropSession && cropSession.items.length > 1
            ? `Crop photo (${cropSession.index + 1} of ${cropSession.items.length})`
            : 'Crop product photo'
        }
        saving={false}
        onClose={closeCropSession}
        onConfirm={handleCropConfirm}
      />
    </SellerPageShell>
  )
}
