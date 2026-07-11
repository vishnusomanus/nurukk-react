import { cn } from '@/utils/cn'

export function brandLogoSrc() {
  return `${import.meta.env.BASE_URL}app-icons/brand.png`
}

export function BrandLogo({
  size = 'lg',
  className,
  alt,
}: {
  /** @deprecated Shared brand mark — role no longer switches the logo. */
  role?: string | null
  /** @deprecated Shared brand mark — kind no longer switches the logo. */
  kind?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  alt?: string
}) {
  const px = size === 'sm' ? 'h-10 w-auto' : size === 'md' ? 'h-20 w-auto' : 'h-36 w-auto'

  return (
    <img
      src={brandLogoSrc()}
      alt={alt ?? 'nurukk'}
      className={cn(px, 'max-w-[220px] object-contain', className)}
      draggable={false}
    />
  )
}
