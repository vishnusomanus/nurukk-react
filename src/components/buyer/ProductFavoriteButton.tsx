import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

export function ProductFavoriteButton({
  productUuid,
  className,
  activeTone = 'error',
}: {
  productUuid: string
  className?: string
  activeTone?: 'error' | 'primary'
}) {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const { isWishlisted, toggle, isToggling } = useWishlist()
  const [animating, setAnimating] = useState(false)

  const active = isWishlisted(productUuid)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!token) {
      navigate('/login/buyer')
      return
    }
    setAnimating(true)
    window.setTimeout(() => setAnimating(false), 420)
    toggle(productUuid)
  }

  return (
    <button
      type="button"
      disabled={isToggling}
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-70',
        animating && 'favorite-pop',
        active
          ? activeTone === 'primary'
            ? 'text-primary'
            : 'text-error'
          : 'text-outline hover:text-error',
        className,
      )}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
      >
        favorite
      </span>
    </button>
  )
}
