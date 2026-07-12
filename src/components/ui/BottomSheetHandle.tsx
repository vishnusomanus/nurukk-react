import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/** Visual grabber for bottom sheets; spread swipe `handleProps` onto this. */
export function BottomSheetHandle({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex cursor-grab touch-none items-center justify-center pt-1 pb-2 active:cursor-grabbing',
        className,
      )}
      aria-hidden
      {...props}
    >
      <div className="h-1 w-10 rounded-full bg-outline-variant" />
    </div>
  )
}
