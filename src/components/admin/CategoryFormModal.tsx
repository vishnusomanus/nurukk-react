import { useEffect, useState } from 'react'
import type { AdminCategory, CategoryPayload } from '@/api/services/adminCategoriesService'
import { AdminSettingsField, AdminSettingsToggle } from '@/components/admin/AdminSettingsField'
import { cn } from '@/utils/cn'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

type CategoryFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  category?: AdminCategory | null
  saving?: boolean
  onClose: () => void
  onSubmit: (payload: CategoryPayload) => void
}

export function CategoryFormModal({
  open,
  mode,
  category,
  saving,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [showInMenu, setShowInMenu] = useState(true)
  const [menuSortOrder, setMenuSortOrder] = useState(0)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(category?.name ?? '')
    setSlug(category?.slug ?? '')
    setImageUrl(String(category?.image_url ?? ''))
    setIsActive(category?.is_active !== false)
    setShowInMenu(category?.show_in_menu !== false)
    setMenuSortOrder(Number(category?.menu_sort_order ?? 0))
    setSlugTouched(Boolean(category?.slug))
  }, [open, category])

  useEffect(() => {
    if (!open || slugTouched || mode === 'edit') return
    setSlug(slugify(name))
  }, [name, slugTouched, mode, open])

  if (!open) return null

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      image_url: imageUrl.trim() || null,
      is_active: isActive,
      show_in_menu: showInMenu,
      menu_sort_order: menuSortOrder,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={saving ? undefined : onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-headline-lg text-on-surface">
              {mode === 'create' ? 'Add New Category' : 'Edit Category'}
            </h3>
            <p className="text-body-md mt-1 text-on-surface-variant">
              {mode === 'create'
                ? 'Create a classification for marketplace products.'
                : 'Update category details and buyer menu visibility.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <AdminSettingsField label="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
          <AdminSettingsField
            label="URL slug"
            hint="Used in category URLs. Auto-generated from the name unless edited."
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            required
          />
          <AdminSettingsField
            label="Image URL"
            hint="Optional hero or icon image for buyer category pages."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <AdminSettingsField
            label="Menu sort order"
            type="number"
            min={0}
            value={menuSortOrder}
            onChange={(e) => setMenuSortOrder(Number(e.target.value) || 0)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminSettingsToggle label="Active" checked={isActive} onChange={setIsActive} />
            <AdminSettingsToggle label="Show in buyer menu" checked={showInMenu} onChange={setShowInMenu} />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/30 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-outline-variant px-5 py-2.5 font-bold text-on-surface-variant"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className={cn(
                'rounded-xl bg-primary px-5 py-2.5 font-bold text-on-primary disabled:opacity-50',
                'transition-transform active:scale-95',
              )}
            >
              {saving ? 'Saving…' : mode === 'create' ? 'Create category' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
