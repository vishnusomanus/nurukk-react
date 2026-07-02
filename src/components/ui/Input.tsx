import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string | null
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, ...props },
  ref,
) {
  const required = Boolean(props.required || props['aria-required'])

  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-xs font-medium text-zinc-700 dark:text-white/70">
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </div>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35',
          error
            ? 'border-rose-500/60 focus:ring-rose-500/50'
            : 'border-black/10 dark:border-white/10',
          className,
        )}
        {...props}
      />
      {error ? <div className="mt-1 text-xs text-rose-300">{error}</div> : null}
    </label>
  )
})
