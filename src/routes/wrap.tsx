import { Suspense, type ReactNode } from 'react'
import { PageLoader } from '@/components/common/PageLoader'

export function wrap(el: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{el}</Suspense>
}
