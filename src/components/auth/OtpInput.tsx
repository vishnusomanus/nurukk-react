import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

export function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, ' ').slice(0, 6).split('')

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const setDigit = (index: number, digit: string) => {
    const next = digits.map((d, i) => (i === index ? digit : d === ' ' ? '' : d)).join('')
    onChange(next.replace(/\s/g, '').slice(0, 6))
  }

  return (
    <div>
      <div className="flex justify-center gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            value={digit.trim()}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(-1)
              setDigit(index, v)
              if (v && index < 5) inputsRef.current[index + 1]?.focus()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digit.trim() && index > 0) {
                inputsRef.current[index - 1]?.focus()
              }
            }}
            onPaste={(e) => {
              e.preventDefault()
              const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
              if (pasted) onChange(pasted)
            }}
            className={cn(
              'h-14 w-11 rounded-lg border border-white/50 bg-white/50 text-center text-xl font-bold text-zinc-900 shadow-sm transition focus:border-emerald-600/50 focus:bg-white focus:shadow-[0_0_15px_rgba(13,99,27,0.3)] focus:outline-none sm:h-16 sm:w-12 dark:border-white/10 dark:bg-white/5 dark:text-white',
            )}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">{value.length}/6</p>
    </div>
  )
}
