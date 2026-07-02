import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-container-high', className)}
      {...props}
    />
  )
}
