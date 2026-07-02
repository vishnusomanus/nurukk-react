import { useSearchParams } from 'react-router-dom'
import { CategoryListingView } from '@/components/buyer/CategoryListingView'

export function BuyerSearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''

  return (
    <CategoryListingView
      searchQuery={q}
      title="Search"
      backTo="/buyer"
      emptyMessage={
        q.trim()
          ? `No products or farm stores found for "${q.trim()}"`
          : 'Enter a search term on the home page to find fresh produce and local farms.'
      }
    />
  )
}
