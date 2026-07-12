import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'

const DEFAULT_SUGGESTIONS = [
  'tomatoes',
  'spinach',
  'cut vegetables',
  'organic carrots',
  'fresh coriander',
  'onions',
  'potatoes',
  'green chillies',
] as const

type HomeSearchBarProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  suggestions?: readonly string[]
  className?: string
}

export function HomeSearchBar({
  value,
  onChange,
  onSubmit,
  suggestions = DEFAULT_SUGGESTIONS,
  className,
}: HomeSearchBarProps) {
  const [focused, setFocused] = useState(false)
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const idle = !focused && value.trim().length === 0

  useEffect(() => {
    if (!idle || suggestions.length === 0) return

    const interval = window.setInterval(() => {
      setVisible(false)
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % suggestions.length)
        setVisible(true)
      }, 280)
    }, 2600)

    return () => window.clearInterval(interval)
  }, [idle, suggestions])

  const suggestion = suggestions[index] ?? suggestions[0]

  return (
    <form className={cn('lg:hidden', className)} onSubmit={onSubmit}>
      <label
        className={cn(
          'group relative flex h-12 items-center gap-3 rounded-2xl border bg-white px-3.5 shadow-[0_6px_20px_-8px_rgba(15,40,20,0.18)] transition-[border-color,box-shadow] [color-scheme:light]',
          focused
            ? 'border-primary/35 shadow-[0_10px_28px_-10px_rgba(13,99,27,0.28)]'
            : 'border-black/[0.06]',
        )}
      >
        <span
          className={cn(
            'material-symbols-outlined shrink-0 text-[22px] transition-colors',
            focused ? 'text-primary' : 'text-[#6b7568]',
          )}
        >
          search
        </span>

        <div className="relative min-w-0 flex-1">
          {idle ? (
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-y-0 left-0 flex items-center text-[16px] leading-5 text-[#6b7568] transition-all duration-300 ease-out',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
              )}
            >
              Search for{' '}
              <span className="ml-1 font-semibold text-[#1b1c1c]">“{suggestion}”</span>
            </span>
          ) : null}

          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="Search products"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className="relative z-10 h-11 w-full border-none bg-transparent text-[16px] leading-5 text-[#1b1c1c] outline-none placeholder:text-transparent focus:ring-0"
            placeholder={idle ? `Search for “${suggestion}”` : 'Search fresh vegetables'}
          />
        </div>

        {value.trim() ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onChange('')}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-[#6b7568] transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        ) : null}
      </label>
    </form>
  )
}
