import { useEffect, useState } from 'react'
import type { AdminProductTag, ProductTagPayload } from '@/api/services/adminProductTagsService'
import { AdminSettingsField, AdminSettingsToggle } from '@/components/admin/AdminSettingsField'
import { cn } from '@/utils/cn'

function tagValueFromLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

type TagFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  tag?: AdminProductTag | null
  saving?: boolean
  onClose: () => void
  onSubmit: (payload: ProductTagPayload) => void
}

export function TagFormModal({ open, mode, tag, saving, onClose, onSubmit }: TagFormModalProps) {
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const [valueTouched, setValueTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setLabel(tag?.label ?? '')
    setValue(tag?.value ?? '')
    setIsActive(tag?.is_active !== false)
    setSortOrder(Number(tag?.sort_order ?? 0))
    setValueTouched(Boolean(tag?.value))
  }, [open, tag])

  useEffect(() => {
    if (!open || valueTouched || mode === 'edit') return
    setValue(tagValueFromLabel(label))
  }, [label, valueTouched, mode, open])

  if (!open) return null

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit({
      label: label.trim(),
      value: value.trim() || tagValueFromLabel(label),
      is_active: isActive,
      sort_order: sortOrder,
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
              {mode === 'create' ? 'Create New Tag' : 'Edit Tag'}
            </h3>
            <p className="text-body-md mt-1 text-on-surface-variant">
              {mode === 'create'
                ? 'Add a marketplace tag sellers can assign to products.'
                : 'Update tag label, visibility, and display order.'}
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
          <AdminSettingsField label="Tag label" value={label} onChange={(e) => setLabel(e.target.value)} required />
          <AdminSettingsField
            label="Tag value"
            hint="Internal key used in filters and product data. Auto-generated from the label unless edited."
            value={value}
            onChange={(e) => {
              setValueTouched(true)
              setValue(e.target.value)
            }}
            required
          />
          <AdminSettingsField
            label="Sort order"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          />
          <AdminSettingsToggle label="Active" checked={isActive} onChange={setIsActive} />

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
              disabled={saving || !label.trim()}
              className={cn(
                'rounded-xl bg-primary px-5 py-2.5 font-bold text-on-primary disabled:opacity-50',
                'transition-transform active:scale-95',
              )}
            >
              {saving ? 'Saving…' : mode === 'create' ? 'Create tag' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
