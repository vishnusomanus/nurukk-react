import { cn } from '@/utils/cn'

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface shadow-sm',
        className,
      )}
      {...rest}
    />
  )
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={cn('border-b border-outline-variant/30 px-4 py-3', className)} {...rest} />
}

export function CardTitle(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={cn('text-headline-lg font-bold text-on-surface', className)} {...rest} />
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={cn('px-4 py-4', className)} {...rest} />
}
