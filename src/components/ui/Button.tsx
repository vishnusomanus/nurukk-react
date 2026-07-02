import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const styles: Record<Variant, string> = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-emerald-600/40 disabled:text-white/60',
  secondary:
    'border border-outline-variant/30 bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:bg-surface-container disabled:opacity-50',
  ghost:
    'bg-transparent text-on-surface hover:bg-surface-container-low active:bg-surface-container disabled:opacity-50',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 disabled:bg-rose-600/40 disabled:text-white/60',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/40',
        styles[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})
