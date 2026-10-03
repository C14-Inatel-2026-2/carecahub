import useSWR from 'swr'
import { buildQueryString, type FetcherParams } from '@/api'
import type { PaginateParams, PaginateResponse } from '@/types/api'
import type { GetGroupResponse } from '@/types/group'
import type { Notification } from '@/types/notification'
import type { GetProjectResponse } from '@/types/project'
import type { GetRepositoryResponse } from '@/types/repository'
import type { GetUserResponse } from '@/types/user'

type UseListParams = {
  endpoint:
    | '/users'
    | '/groups'
    | '/projects'
    | '/repositories'
    | '/notifications'
    | '/notifications/group-invites/candidates'
  params: PaginateParams
}

type ResponseTypeMap = {
  '/users': GetUserResponse
  '/users/:id': GetUserResponse
  '/groups': GetGroupResponse
  '/groups/:id': GetGroupResponse
  '/projects': GetProjectResponse
  '/projects/:id': GetProjectResponse
  '/repositories': GetRepositoryResponse
  '/repositories/:id': GetRepositoryResponse
  '/notifications': Notification
  '/notifications/group-invites/candidates': GetUserResponse
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
    unreadCount: response?.data?.unreadCount ?? 0,
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
