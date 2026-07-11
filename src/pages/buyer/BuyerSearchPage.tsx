import { useSearchParams } from 'react-router-dom'
import { CategoryListingView } from '@/components/buyer/CategoryListingView'

export function BuyerSearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''

  const setQuery = (next: string) => {
    const value = next.trim()
    const nextParams = new URLSearchParams(params)
    if (value) nextParams.set('q', value)
    else nextParams.delete('q')
    setParams(nextParams, { replace: true })
  }

  return (
    <CategoryListingView
      searchQuery={q}
      onSearchQueryChange={setQuery}
      title="Search"
      backTo="/buyer"
      emptyMessage={
        q.trim()
          ? `No products or farm stores found for "${q.trim()}"`
          : 'Type above to find fresh produce and local farms.'
      }
    />
  )
}
