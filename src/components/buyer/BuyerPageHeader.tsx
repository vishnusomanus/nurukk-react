import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function BuyerPageHeader({
  title,
  backTo,
  right,
  className,
}: {
  title: string
  backTo?: string
  right?: React.ReactNode
  className?: string
}) {
  const navigate = useNavigate()

  return (
    <header
      className={cn(
        'fixed top-0 z-40 flex h-16 w-full max-w-lg items-center justify-between bg-surface px-margin-mobile shadow-sm lg:hidden',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {backTo ? (
          <Link
            to={backTo}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95 hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95 hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
        )}
        <h1 className="text-headline-lg-mobile font-bold text-primary">{title}</h1>
      </div>
      {right}
    </header>
  )
}
