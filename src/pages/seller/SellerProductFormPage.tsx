import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyerService, uploadService } from '@/api/services'
import * as sellerService from '@/api/services/sellerService'
import type { CreateProductPayload } from '@/api/services/sellerService'
import { ProductImageCropModal } from '@/components/seller/ProductImageCropModal'
import { getApiErrorMessage, getApiFieldErrorMap } from '@/utils/apiErrorMessage'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'
import { blobToFile, readFileAsObjectUrl } from '@/utils/cropImage'
import { applyNutritionToFormFields, buildNutritionPayload } from '@/utils/productNutrition'
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

  if (!isEdit && !form.category_uuid) errors.category_uuid = 'Select a category'

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
    'w-full rounded-lg border bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all focus:ring-1',
    hasError
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-outline-variant/50 focus:border-primary focus:ring-primary',
  )
}

export function SellerProductFormPage() {
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
      category_uuid: '',
      description: product.description ?? '',
      price: product.price != null ? String(product.price) : '',
      discount_price: product.discount_price != null ? String(product.discount_price) : '',
      unit: product.unit ?? 'kg',
      stock: product.stock != null ? String(product.stock) : '',
      imageUrls: [...existingImages, '', '', ''].slice(0, 3),
      ...applyNutritionToFormFields(product.nutrition ?? {}),
    })
    setPendingFiles([null, null, null])
  }, [productData])

  const categories = categoriesData?.data ?? []

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
          description: payload.description ?? null,
          price: payload.price,
          discount_price: payload.discount_price ?? null,
          stock: payload.stock,
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

  const openFilePicker = (slotIndex?: number) => {
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
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="flex justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 md:p-8 stitch-card-shadow">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-headline-xl text-on-surface">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {isEdit ? 'Update your farm-fresh listing.' : 'Create a new farm-fresh listing for the marketplace.'}
            </p>
          </div>
          <Link
            to="/seller/products"
            className="flex items-center gap-2 text-label-md tracking-wider text-on-surface-variant uppercase transition-colors hover:text-error"
          >
            <span className="material-symbols-outlined">close</span>
            Discard Changes
          </Link>
        </div>

        <div className="mb-8 flex overflow-x-auto border-b border-outline-variant/30 stitch-hide-scrollbar">
          {STEPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(item.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-body-md whitespace-nowrap transition-colors',
                step === item.id
                  ? 'border-b-[3px] border-primary font-bold text-primary'
                  : 'text-on-surface-variant hover:text-primary',
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <form className="space-y-8" onSubmit={handleSubmit} noValidate>
          {(step === 'basic' || step === 'pricing' || step === 'inventory') && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {step === 'basic' ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-label-md tracking-wider text-on-surface-variant uppercase">
                      Product Name
                    </label>
                    <input
                      value={form.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      placeholder="e.g. Organic Baby Spinach"
                      className={fieldClass(Boolean(fieldErrors.name))}
                      aria-invalid={Boolean(fieldErrors.name)}
                    />
                    {fieldErrors.name ? <p className="text-sm text-error">{fieldErrors.name}</p> : null}
                  </div>

                  {!isEdit ? (
                    <div className="space-y-2">
                      <label className="block text-label-md tracking-wider text-on-surface-variant uppercase">
                        Category
                      </label>
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
                        <p className="text-sm text-error">{fieldErrors.category_uuid}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-label-md tracking-wider text-on-surface-variant uppercase">
                      Product Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(event) => updateField('description', event.target.value)}
                      placeholder="Describe the freshness, farm origin, and nutritional value..."
                      rows={4}
                      className={cn(fieldClass(false), 'resize-none')}
                    />
                  </div>
                </>
              ) : null}

              {step === 'pricing' ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-label-md tracking-wider text-on-surface-variant uppercase">
                      Original Price
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-price-display text-on-surface-variant">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(event) => updateField('price', event.target.value)}
                        className={cn(
                          fieldClass(Boolean(fieldErrors.price)),
                          'py-3 pr-4 pl-8 text-price-display',
                        )}
                        aria-invalid={Boolean(fieldErrors.price)}
                      />
                    </div>
                    {fieldErrors.price ? <p className="text-sm text-error">{fieldErrors.price}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label-md tracking-wider text-on-surface-variant uppercase">
                      Discount Price
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-price-display text-on-surface-variant">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discount_price}
                        onChange={(event) => updateField('discount_price', event.target.value)}
                        className={cn(
                          fieldClass(Boolean(fieldErrors.discount_price)),
                          'py-3 pr-4 pl-8 text-price-display',
                        )}
                        aria-invalid={Boolean(fieldErrors.discount_price)}
                      />
                    </div>
                    {fieldErrors.discount_price ? (
                      <p className="text-sm text-error">{fieldErrors.discount_price}</p>
                    ) : null}
                  </div>
                </>
              ) : null}

              {step === 'inventory' ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-label-md tracking-wider text-on-surface-variant uppercase">
                      Unit
                    </label>
                    <input
                      value={form.unit}
                      onChange={(event) => updateField('unit', event.target.value)}
                      placeholder="kg, bunch, pack..."
                      className={fieldClass(Boolean(fieldErrors.unit))}
                      aria-invalid={Boolean(fieldErrors.unit)}
                    />
                    {fieldErrors.unit ? <p className="text-sm text-error">{fieldErrors.unit}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label-md tracking-wider text-on-surface-variant uppercase">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={(event) => updateField('stock', event.target.value)}
                      className={fieldClass(Boolean(fieldErrors.stock))}
                      aria-invalid={Boolean(fieldErrors.stock)}
                    />
                    {fieldErrors.stock ? <p className="text-sm text-error">{fieldErrors.stock}</p> : null}
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-label-md tracking-wider text-on-surface-variant uppercase">
                          Nutrition (per 100g)
                        </h3>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                          Optional. Auto-fill uses the open{' '}
                          <a
                            href="https://world.openfoodfacts.org/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline"
                          >
                            Open Food Facts
                          </a>{' '}
                          database. Values are shown to buyers per kg.
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[240px]">
                        <input
                          value={nutritionLookupQuery}
                          onChange={(event) => setNutritionLookupQuery(event.target.value)}
                          placeholder={form.name.trim() || 'Search food name'}
                          disabled={!nutritionLookupAvailable || nutritionLookup.isPending}
                          className={fieldClass(false)}
                        />
                        <button
                          type="button"
                          disabled={
                            !nutritionLookupAvailable ||
                            nutritionLookup.isPending ||
                            !(nutritionLookupQuery.trim() || form.name.trim())
                          }
                          onClick={() =>
                            nutritionLookup.mutate((nutritionLookupQuery.trim() || form.name.trim()))
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary-container/30 px-4 py-2 text-label-md text-primary transition-colors hover:bg-primary-container/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">nutrition</span>
                          {nutritionLookup.isPending ? 'Looking up…' : 'Auto-calculate'}
                        </button>
                      </div>
                    </div>
                    {!nutritionLookupAvailable ? (
                      <p className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant">
                        {nutritionStatus?.reason ?? 'Nutrition auto-calculate is unavailable.'}
                      </p>
                    ) : openFoodFactsStatus?.monthly_limit ? (
                      <p className="text-sm text-on-surface-variant">
                        Open Food Facts lookups this month: {openFoodFactsStatus.requests_this_month ?? 0} /{' '}
                        {openFoodFactsStatus.monthly_limit}
                      </p>
                    ) : null}
                    {nutritionLookup.error ? (
                      <p className="text-sm text-error">
                        {getApiErrorMessage(nutritionLookup.error, 'Nutrition lookup failed')}
                      </p>
                    ) : null}
                    {nutritionSourceNote ? (
                      <p className="rounded-lg bg-primary-container/20 px-3 py-2 text-sm text-on-surface">
                        {nutritionSourceNote}
                      </p>
                    ) : null}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <label className="block text-label-md text-on-surface-variant">Calories</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.nutrition_calories}
                          onChange={(event) => updateField('nutrition_calories', event.target.value)}
                          placeholder="e.g. 23"
                          className={fieldClass(Boolean(fieldErrors.nutrition_calories))}
                        />
                        {fieldErrors.nutrition_calories ? (
                          <p className="text-sm text-error">{fieldErrors.nutrition_calories}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-label-md text-on-surface-variant">Protein (g)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.nutrition_protein_g}
                          onChange={(event) => updateField('nutrition_protein_g', event.target.value)}
                          placeholder="e.g. 2.9"
                          className={fieldClass(Boolean(fieldErrors.nutrition_protein_g))}
                        />
                        {fieldErrors.nutrition_protein_g ? (
                          <p className="text-sm text-error">{fieldErrors.nutrition_protein_g}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-label-md text-on-surface-variant">Fat (g)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.nutrition_fat_g}
                          onChange={(event) => updateField('nutrition_fat_g', event.target.value)}
                          placeholder="e.g. 0.4"
                          className={fieldClass(Boolean(fieldErrors.nutrition_fat_g))}
                        />
                        {fieldErrors.nutrition_fat_g ? (
                          <p className="text-sm text-error">{fieldErrors.nutrition_fat_g}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-label-md text-on-surface-variant">Carbohydrates (g)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.nutrition_carbohydrates_g}
                          onChange={(event) => updateField('nutrition_carbohydrates_g', event.target.value)}
                          placeholder="e.g. 3.6"
                          className={fieldClass(Boolean(fieldErrors.nutrition_carbohydrates_g))}
                        />
                        {fieldErrors.nutrition_carbohydrates_g ? (
                          <p className="text-sm text-error">{fieldErrors.nutrition_carbohydrates_g}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-label-md text-on-surface-variant">Fiber (g)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.nutrition_fiber_g}
                          onChange={(event) => updateField('nutrition_fiber_g', event.target.value)}
                          placeholder="e.g. 2.2"
                          className={fieldClass(Boolean(fieldErrors.nutrition_fiber_g))}
                        />
                        {fieldErrors.nutrition_fiber_g ? (
                          <p className="text-sm text-error">{fieldErrors.nutrition_fiber_g}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-label-md text-on-surface-variant">Sugar (g)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.nutrition_sugar_g}
                          onChange={(event) => updateField('nutrition_sugar_g', event.target.value)}
                          placeholder="e.g. 0.4"
                          className={fieldClass(Boolean(fieldErrors.nutrition_sugar_g))}
                        />
                        {fieldErrors.nutrition_sugar_g ? (
                          <p className="text-sm text-error">{fieldErrors.nutrition_sugar_g}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-label-md text-on-surface-variant">Vitamins</label>
                        <input
                          value={form.nutrition_vitamins}
                          onChange={(event) => updateField('nutrition_vitamins', event.target.value)}
                          placeholder="e.g. A, C, K"
                          className={fieldClass(false)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-label-md text-on-surface-variant">Iron (mg)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.nutrition_iron_mg}
                          onChange={(event) => updateField('nutrition_iron_mg', event.target.value)}
                          placeholder="e.g. 2.7"
                          className={fieldClass(Boolean(fieldErrors.nutrition_iron_mg))}
                        />
                        {fieldErrors.nutrition_iron_mg ? (
                          <p className="text-sm text-error">{fieldErrors.nutrition_iron_mg}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {step === 'images' ? (
            <div className="space-y-4">
              <label className="block text-label-md tracking-wider text-on-surface-variant uppercase">
                Product Photography (Max 3)
              </label>
              <p className="text-body-md text-on-surface-variant">
                Pick photos to crop before publish. Images upload when you save the product. The first photo is the
                primary listing image.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => openFilePicker()}
                  disabled={Boolean(cropSession) || saveProduct.isPending}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-label-md text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
              </div>
              {uploadError ? <p className="text-sm text-error">{uploadError}</p> : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                        'flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-surface-container',
                        url ? 'border-solid p-0' : 'cursor-pointer p-4 hover:border-primary hover:bg-surface-container-high',
                      )}
                    >
                      {url ? (
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-4xl text-outline">add_a_photo</span>
                          <p className="text-label-md text-on-surface-variant">
                            {index === 0 ? 'Primary Image' : 'Add Image'}
                          </p>
                        </>
                      )}
                    </div>
                    {url ? (
                      <>
                        {pendingFiles[index] ? (
                          <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-0.5 text-xs text-on-primary">
                            Cropped
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeImageAt(index)}
                          className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-surface/90 text-on-surface shadow-sm transition-colors hover:bg-error-container hover:text-error"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {saveProduct.error ? (
            <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-error">
              {getApiErrorMessage(saveProduct.error, 'Failed to save product')}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-6 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => navigate('/seller/products')}
              className="rounded-xl border border-outline px-6 py-3 text-label-md text-on-surface transition-colors hover:bg-surface-variant"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveProduct.isPending || uploadingImages}
              className="rounded-xl bg-primary px-8 py-3 text-label-md text-on-primary transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveProduct.isPending || uploadingImages
                ? 'Saving...'
                : isEdit
                  ? 'Save Changes'
                  : 'Publish Product'}
            </button>
          </div>
        </form>

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
      </div>
    </div>
  )
}
