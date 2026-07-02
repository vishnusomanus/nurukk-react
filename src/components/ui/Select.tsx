import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export type SelectOption = { value: string; label: string; disabled?: boolean }

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string | null
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, options, placeholder, ...props },
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
      <select
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]',
          error
            ? 'border-rose-500/60 focus:ring-rose-500/50'
            : 'border-black/10 dark:border-white/10',
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white"
          >
            {o.label}
          </option>
        ))}
      </select>
      {error ? <div className="mt-1 text-xs text-rose-300">{error}</div> : null}
    </label>
  )
})
