import { useEffect, useState } from 'react'
import type { BuyerProduct } from '@/api/services/buyerService'
import { getProductImage } from '@/utils/productImage'
import { cn } from '@/utils/cn'

type ProductImageProps = {
  product?: BuyerProduct | null
  src?: string | null
  alt?: string
  className?: string
}

export function ProductImage({ product, src, alt, className }: ProductImageProps) {
  return (
    <img
      src={src || getProductImage(product)}
      alt={alt ?? product?.name ?? ''}
      className={cn(className)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  )
}

export function RemoteImage({
  src,
  alt = '',
  className,
  priority = false,
  fallbackSrc,
}: {
  src: string
  alt?: string
  className?: string
  priority?: boolean
  fallbackSrc?: string
}) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={cn(className)}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc)
        }
      }}
    />
  )
}
