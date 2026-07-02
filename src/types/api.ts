export type ApiError = {
  status: boolean
  message: string
  errors?: Record<string, unknown> | string[] | null
}

export type GenericSuccess<T = unknown> = {
  status: boolean
  message: string
  data: T
}

export type Paginated<T> = {
  data: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}
