import { cn } from '@/utils/cn'

const labelClass = 'text-label-md px-1 font-semibold tracking-wide text-on-surface-variant uppercase'
const inputClass =
  'text-body-lg w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20'
const hintClass = 'text-body-md px-1 text-on-surface-variant'

type AdminSettingsFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string
  hint?: string
  className?: string
}

export function AdminSettingsField({ label, hint, className, ...props }: AdminSettingsFieldProps) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      <span className={labelClass}>{label}</span>
      <input className={inputClass} {...props} />
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </label>
  )
}

type AdminSettingsTextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  label: string
  hint?: string
  className?: string
}

export function AdminSettingsTextarea({ label, hint, className, ...props }: AdminSettingsTextareaProps) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      <span className={labelClass}>{label}</span>
      <textarea className={cn(inputClass, 'min-h-[120px] resize-y font-mono text-body-md')} {...props} />
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </label>
  )
}

type AdminSettingsSelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  label: string
  hint?: string
  options: string[]
  className?: string
}

export function AdminSettingsSelect({ label, hint, options, className, ...props }: AdminSettingsSelectProps) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      <span className={labelClass}>{label}</span>
      <select className={inputClass} {...props}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </label>
  )
}

type AdminSettingsToggleProps = {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function AdminSettingsToggle({ label, hint, checked, onChange, className }: AdminSettingsToggleProps) {
  return (
    <div className={cn('flex flex-col gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4', className)}>
      <label className="flex items-center justify-between gap-4">
        <span className="text-body-lg font-medium text-on-surface">{label}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
        />
      </label>
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </div>
  )
}
