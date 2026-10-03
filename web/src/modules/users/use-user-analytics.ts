import useSWR from 'swr'
import { fetcher } from '@/api'
import { isMockAPIEnabled } from '@/mocks/config'
import { mockUsers } from '@/mocks/users'
import type { UserAnalyticsResponse } from '@/types/user'
import { getUserAnalyticsFromUsers, getUserAnalyticsKey } from './user-analytics'

const mockUserAnalytics = getUserAnalyticsFromUsers(mockUsers)

async function fetchUserAnalytics(url: string): Promise<UserAnalyticsResponse> {
  if (isMockAPIEnabled) return mockUserAnalytics
  return fetcher<UserAnalyticsResponse>({ url })
}

export function useUserAnalytics(enabled: boolean) {
  const response = useSWR<UserAnalyticsResponse>(getUserAnalyticsKey(enabled), fetchUserAnalytics, {
    fallbackData: enabled && isMockAPIEnabled ? mockUserAnalytics : undefined,
  })

  return {
    data: response.data,
    error: response.error,
    isLoading: response.isLoading,
    mutate: response.mutate,
  }
}
