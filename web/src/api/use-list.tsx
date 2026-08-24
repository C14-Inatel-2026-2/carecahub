import useSWR from 'swr'
import { buildQueryString, type FetcherParams } from '@/api'
import type { PaginateParams, PaginateResponse } from '@/types/api'
import type { GetPostResponse } from '@/types/post'
import type { GetUserResponse } from '@/types/user'

type UseListParams =
  | {
      endpoint: '/users'
      params: PaginateParams
    }
  | {
      endpoint: '/posts'
      params: PaginateParams
    }

type ResponseTypeMap = {
  '/users': GetUserResponse
  '/users/:id': GetUserResponse
  '/posts': GetPostResponse
  '/posts/:id': GetPostResponse
}

/**
 * Custom SWR hook for fetching paginated list
 *
 * Features:
 * - Automatic caching and revalidation
 * - Deduplication of requests
 * - Error handling via global SWR config
 * - Optimistic updates via mutate
 *
 * @param params Pagination and filter parameters
 * @returns Paginated list with metadata
 */
export function useList<T extends UseListParams>({
  endpoint,
  params,
  disabled,
}: T & {
  disabled?: boolean
}) {
  const swrKey: FetcherParams | null = disabled
    ? null
    : { url: `${endpoint}${buildQueryString(params)}` }

  const response = useSWR<PaginateResponse<ResponseTypeMap[T['endpoint']]>>(swrKey)

  return {
    data: (Array.isArray(response?.data?.data)
      ? response.data.data
      : []) as ResponseTypeMap[T['endpoint']][],
    totalCount: response?.data?.totalCount ?? 0,
    isLoading: response.isLoading,
    error: response.error,
    mutate: response.mutate,
  }
}

/**
 * useSWR with typed response for single resource fetching.
 *
 * @param query Optional query string params (for dashboards, `/doctor-time-slots/available`, etc.)
 */
export function useGet<T extends keyof ResponseTypeMap>(
  endpoint: T,
  id?: string | null,
  query?: Record<string, string | number | boolean | Date | null | undefined>,
  disabled?: boolean
) {
  const isIdEndpoint = endpoint.includes(':id')
  const basePath = isIdEndpoint ? (id ? endpoint.replace(':id', id) || null : null) : endpoint

  const url =
    query !== undefined && Object.keys(query).length > 0
      ? `${basePath}${buildQueryString(query)}`
      : basePath

  return useSWR<ResponseTypeMap[T]>(
    // biome-ignore lint/suspicious/noExplicitAny: fix swr
    disabled || !basePath ? null : url ? ({ url } as unknown as any) : null
  )
}
