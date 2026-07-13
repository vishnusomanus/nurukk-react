import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as supportService from '@/api/services/supportService'
import type { SupportApp } from '@/api/services/supportService'
import * as uploadService from '@/api/services/uploadService'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { displayUserEmail } from '@/utils/userEmail'
import { cn } from '@/utils/cn'

const MAX_SCREENSHOTS = 5

export function HelpSupportForm({
  app,
  className,
}: {
  app: SupportApp
  className?: string
}) {
  const user = useAuthStore((s) => s.user)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(displayUserEmail(user?.email))
  const [mobile, setMobile] = useState(user?.phone ?? '')
  const [description, setDescription] = useState('')
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (user?.name) setName(user.name)
    if (user?.phone) setMobile(user.phone)
    const shownEmail = displayUserEmail(user?.email)
    if (shownEmail) setEmail(shownEmail)
  }, [user?.name, user?.phone, user?.email])

  const submitMutation = useMutation({
    mutationFn: () =>
      supportService.submitSupportTicket({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        description: description.trim(),
        screenshot_urls: screenshotUrls,
        app,
      }),
    onSuccess: () => {
      setDone(true)
      setDescription('')
      setScreenshotUrls([])
    },
  })

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploadError(null)
    const remaining = MAX_SCREENSHOTS - screenshotUrls.length
    if (remaining <= 0) {
      setUploadError(`You can attach up to ${MAX_SCREENSHOTS} screenshots.`)
      return
    }
    const selected = Array.from(files).slice(0, remaining)
    setUploading(true)
    try {
      const result = await uploadService.uploadImages(selected)
      setScreenshotUrls((prev) => [...prev, ...(result.data?.urls ?? [])].slice(0, MAX_SCREENSHOTS))
    } catch (err) {
      setUploadError(getApiErrorMessage(err, 'Could not upload screenshots'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    mobile.trim().length > 0 &&
    description.trim().length >= 10 &&
    !uploading &&
    !submitMutation.isPending

  const fieldClass =
    'h-12 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 text-[16px] text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 lg:bg-surface-container-lowest lg:text-sm'

  return (
    <form
      className={cn('space-y-4 lg:space-y-5', className)}
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit) return
        setDone(false)
        submitMutation.mutate()
      }}
    >
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant lg:text-sm">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant lg:text-sm">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant lg:text-sm">
          Mobile
        </label>
        <input
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant lg:text-sm">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          minLength={10}
          placeholder="Tell us what you need help with…"
          className="w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3 text-[16px] text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 lg:bg-surface-container-lowest lg:text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant lg:text-sm">
          Screenshots{' '}
          <span className="font-normal text-on-surface-variant">(optional, max {MAX_SCREENSHOTS})</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading || screenshotUrls.length >= MAX_SCREENSHOTS}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface text-sm font-semibold text-on-surface-variant disabled:opacity-50 lg:bg-surface-container-lowest"
        >
          <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
          {uploading ? 'Uploading…' : 'Add screenshots'}
        </button>
        {screenshotUrls.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {screenshotUrls.map((url) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-surface-container">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setScreenshotUrls((prev) => prev.filter((item) => item !== url))}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Remove screenshot"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {uploadError ? <p className="mt-2 text-sm text-error">{uploadError}</p> : null}
      </div>

      {submitMutation.isError ? (
        <p className="text-sm text-error">
          {getApiErrorMessage(submitMutation.error, 'Could not submit support request')}
        </p>
      ) : null}
      {done && !submitMutation.isError ? (
        <p className="rounded-xl bg-primary-container/15 px-3 py-2 text-sm font-semibold text-primary">
          Thanks — your request was sent. Our team will get back to you.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60 lg:w-auto lg:min-w-[200px] lg:px-8"
      >
        {submitMutation.isPending ? 'Sending…' : 'Submit request'}
      </button>
    </form>
  )
}
