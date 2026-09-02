import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getTableColumns } from 'drizzle-orm'
import { users } from '../entities/user'
import { USER_ROLE, USER_ROLES } from './userEnums'

describe('user roles', () => {
  it('includes the mentor role in the API and database role values', () => {
    assert.deepEqual(USER_ROLES, ['admin', 'teacher', 'mentor', 'student'])
    assert.equal(USER_ROLE.mentor, 'mentor')
  })
})

describe('user academic fields', () => {
  it('allows users without registration at database level', () => {
    assert.equal(getTableColumns(users).registration.notNull, false)
  })
})
