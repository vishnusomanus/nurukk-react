import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'

export async function uploadImages(files: File[]) {
  const form = new FormData()
  for (const file of files) {
    form.append('images[]', file)
  }
  const { data } = await apiClient.post<GenericSuccess<{ urls: string[] }>>('/v1/uploads/images', form, {
    headers: { 'Content-Type': undefined },
    transformRequest: [(body, headers) => {
      if (body instanceof FormData && headers) {
        delete headers['Content-Type']
      }
      return body
    }],
  })
  const urls = data.data?.urls?.map(resolveApiAssetUrl) ?? []
  return { ...data, data: { ...data.data, urls } }
}
