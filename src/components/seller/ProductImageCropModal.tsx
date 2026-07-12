import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'
import { cn } from '@/utils/cn'
import { getCroppedImageBlob } from '@/utils/cropImage'

type ProductImageCropModalProps = {
  open: boolean
  imageSrc: string | null
  title?: string
  saving?: boolean
  onClose: () => void
  onConfirm: (croppedBlob: Blob) => void | Promise<void>
}

export function ProductImageCropModal({
  open,
  imageSrc,
  title = 'Crop product photo',
  saving = false,
  onClose,
  onConfirm,
}: ProductImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = saving || processing
  const { handleProps, sheetStyle } = useSwipeToClose(onClose, {
    enabled: open && !busy,
  })

  useEffect(() => {
    if (!open) return
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError(null)
    setProcessing(false)
  }, [open, imageSrc])

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageSrc || saving || processing) return
    setProcessing(true)
    setError(null)
    try {
      let pixels = croppedAreaPixels
      if (!pixels) {
        setError('Adjust the crop area first.')
        return
      }
      const blob = await getCroppedImageBlob(imageSrc, pixels)
      await onConfirm(blob)
    } catch {
      setError('Could not crop this image. Try another photo.')
    } finally {
      setProcessing(false)
    }
  }

  if (!open || !imageSrc) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={busy ? undefined : onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-crop-title"
        className="relative z-10 flex max-h-[95dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-xl sm:rounded-2xl"
        style={sheetStyle}
      >
        <div className="border-b border-outline-variant/20 px-5 pt-1 pb-4 sm:pt-4">
          <BottomSheetHandle className="sm:hidden" {...handleProps} />
          <h3 id="product-crop-title" className="text-headline-lg text-on-surface">
            {title}
          </h3>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Drag to reposition. Pinch or use the slider to zoom. Photos are saved as square listings.
          </p>
        </div>

        <div className="relative aspect-square w-full bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onCropAreaChange={onCropComplete}
          />
        </div>

        <div className="space-y-4 px-5 py-4">
          <label className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">zoom_in</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-2 flex-1 cursor-pointer accent-primary"
              disabled={busy}
            />
          </label>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-outline px-5 py-2.5 text-label-md text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy || !croppedAreaPixels}
              className={cn(
                'rounded-xl bg-primary px-5 py-2.5 text-label-md text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {busy ? 'Applying…' : 'Apply crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
