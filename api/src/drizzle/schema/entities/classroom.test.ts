import { getTableColumns } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { activityClassrooms, classrooms, groups, users } from '@db'

describe('classroom schema', () => {
  it('links users, groups, and activity audiences to classrooms', () => {
    expect(Object.keys(getTableColumns(classrooms))).toEqual(
      expect.arrayContaining(['id', 'name', 'semester', 'archivedAt', 'createdAt', 'updatedAt']),
    )
    expect(getTableColumns(users)).toHaveProperty('classroomId')
    expect(getTableColumns(groups)).toHaveProperty('classroomId')
    expect(Object.keys(getTableColumns(activityClassrooms))).toEqual(
      expect.arrayContaining(['activityId', 'classroomId']),
    )
  })
})
