import { describe, expect, it } from 'vitest'
import { isAllowedPathForRole } from './auth-layout'

describe('isAllowedPathForRole', () => {
  it('allows students to open project details without granting access to the project list', () => {
    expect(isAllowedPathForRole('/projects/project-1', 'student')).toBe(true)
    expect(isAllowedPathForRole('/projects', 'student')).toBe(false)
    expect(isAllowedPathForRole('/projects/project-1/settings', 'student')).toBe(false)
  })
})
