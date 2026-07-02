import { useParams } from 'react-router-dom'
import { CategoryListingView } from '@/components/buyer/CategoryListingView'

export function CategoryListingPage() {
  const { categoryUuid } = useParams()

  return (
    <CategoryListingView
      categoryUuid={categoryUuid}
      title="Fresh Vegetables"
      backTo="/buyer/categories"
    />
  )
}
