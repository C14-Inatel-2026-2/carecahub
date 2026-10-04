import type { UserAnalyticsResponse, UserRole } from '@/types/user'

export const USER_ANALYTICS_ENDPOINT = '/users/analytics'

export function getUserAnalyticsKey(enabled: boolean): string | null {
  return enabled ? USER_ANALYTICS_ENDPOINT : null
}

export const USER_ANALYTICS_METRICS = [
  { key: 'totalUsers', label: 'Total de usuários' },
  { key: 'admin', label: 'Administradores' },
  { key: 'teacher', label: 'Professores' },
  { key: 'mentor', label: 'Monitores' },
  { key: 'student', label: 'Alunos' },
] as const

export function getUserAnalyticsMetrics(analytics: UserAnalyticsResponse) {
  return USER_ANALYTICS_METRICS.map(({ key, label }) => ({
    key,
    label,
    value: analytics[key],
  }))
}

export function getUserAnalyticsFromUsers(
  users: ReadonlyArray<{ role: UserRole }>
): UserAnalyticsResponse {
  return users.reduce<UserAnalyticsResponse>(
    (analytics, user) => {
      analytics.totalUsers += 1
      analytics[user.role] += 1
      return analytics
    },
    { totalUsers: 0, admin: 0, teacher: 0, mentor: 0, student: 0 }
  )
}
