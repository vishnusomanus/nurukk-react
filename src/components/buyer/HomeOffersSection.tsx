import { useState } from 'react'
import { cn } from '@/utils/cn'

export type HomeOffer = {
  title?: string
  code?: string
}

type HomeOffersSectionProps = {
  offers: HomeOffer[]
  className?: string
}

export function HomeOffersSection({ offers, className }: HomeOffersSectionProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  if (offers.length === 0) return null

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      window.setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current))
      }, 1600)
    } catch {
      // Clipboard may be blocked in some WebViews; ignore quietly.
    }
  }

  return (
    <section className={cn(className)}>
      <div className="mb-4 flex items-end justify-between lg:mb-6">
        <div>
          <h3 className="text-headline-lg-mobile text-on-surface lg:text-headline-lg">Active Offers</h3>
          <p className="text-body-md text-on-surface-variant">Apply these codes at checkout</p>
        </div>
      </div>

      <div className="space-y-3">
        {offers.map((offer, index) => {
          const code = offer.code?.trim()
          const title = offer.title?.trim() || 'Special offer'
          const copied = code != null && copiedCode === code

          return (
            <div
              key={`${code ?? title}-${index}`}
              className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-3.5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-primary">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_offer
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-on-surface sm:text-body-lg">{title}</p>
                {code ? (
                  <p className="text-label-md mt-0.5 font-bold tracking-wider text-primary uppercase">
                    {code}
                  </p>
                ) : (
                  <p className="text-body-md mt-0.5 text-on-surface-variant">Auto-applied at checkout</p>
                )}
              </div>

              {code ? (
                <button
                  type="button"
                  onClick={() => void copyCode(code)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-transform active:scale-95',
                    copied
                      ? 'bg-primary-container text-on-primary-container'
                      : 'border border-primary bg-transparent text-primary',
                  )}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
