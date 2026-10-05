import { describe, expect, it } from 'vitest'
import {
  getUserAnalyticsFromUsers,
  getUserAnalyticsKey,
  getUserAnalyticsMetrics,
} from '../src/modules/users/user-analytics.ts'
import type { UserAnalyticsResponse } from '../src/types/user.ts'

describe('user analytics', () => {
  it('does not request analytics unless enabled for an admin', () => {
    expect(getUserAnalyticsKey(false)).toBeNull()
    expect(getUserAnalyticsKey(true)).toBe('/users/analytics')
  })

  it('counts all roles from the unfiltered mock user collection', () => {
    expect(
      getUserAnalyticsFromUsers([
        { role: 'admin' },
        { role: 'teacher' },
        { role: 'mentor' },
        { role: 'student' },
        { role: 'student' },
      ])
    ).toEqual({ totalUsers: 5, admin: 1, teacher: 1, mentor: 1, student: 2 })
  })

  it('preserves valid zero values in the five displayed metrics', () => {
    const analytics: UserAnalyticsResponse = {
      totalUsers: 0,
      admin: 0,
      teacher: 0,
      mentor: 0,
      student: 0,
    }

    expect(getUserAnalyticsMetrics(analytics)).toEqual([
      { key: 'totalUsers', label: 'Total de usuários', value: 0 },
      { key: 'admin', label: 'Administradores', value: 0 },
      { key: 'teacher', label: 'Professores', value: 0 },
      { key: 'mentor', label: 'Monitores', value: 0 },
      { key: 'student', label: 'Alunos', value: 0 },
    ])
  })
})
