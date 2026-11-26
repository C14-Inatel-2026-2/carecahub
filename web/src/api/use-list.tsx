import useSWR from 'swr'
import { buildQueryString, type FetcherParams } from '@/api'
import { useUser } from '@/stores/use-user'
import type {
  Activity,
  ActivityGroupDelivery,
  ActivityPipeline,
  ActivitySubmission,
  ProjectActivityDelivery,
} from '@/types/activity'
import type { PaginateParams, PaginateResponse } from '@/types/api'
import type { GetGroupResponse } from '@/types/group'
import type { Notification } from '@/types/notification'
import type { GetProjectResponse, ProjectContribution } from '@/types/project'
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
    | '/activities'
  params: PaginateParams
}

type ResponseTypeMap = {
  '/users': GetUserResponse
  '/users/:id': GetUserResponse
  '/groups': GetGroupResponse
  '/groups/:id': GetGroupResponse
  '/projects': GetProjectResponse
  '/projects/:id': GetProjectResponse
  '/projects/by-name/:id': GetProjectResponse
  '/projects/:id/activities': { data: ProjectActivityDelivery[] }
  '/projects/:id/contributions': { data: ProjectContribution[] }
  '/repositories': GetRepositoryResponse
  '/repositories/:id': GetRepositoryResponse
  '/notifications': Notification
  '/notifications/group-invites/candidates': GetUserResponse
  '/activities': Activity
  '/activities/:id': Activity
  '/activities/:id/pipeline': ActivityPipeline
  '/activities/:id/group-delivery': ActivityGroupDelivery
  '/activities/:id/submissions': { data: ActivitySubmission[] }
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
  const userId = useUser((state) => state.user?.id)
  const swrKey: FetcherParams | null = disabled
    ? null
    : { url: `${endpoint}${buildQueryString(params)}`, userId }

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
  const userId = useUser((state) => state.user?.id)
  const isIdEndpoint = endpoint.includes(':id')
  const basePath = isIdEndpoint ? (id ? endpoint.replace(':id', id) || null : null) : endpoint

  const url =
    query !== undefined && Object.keys(query).length > 0
      ? `${basePath}${buildQueryString(query)}`
      : basePath

  return useSWR<ResponseTypeMap[T]>(disabled || !basePath ? null : url ? { url, userId } : null)
}
