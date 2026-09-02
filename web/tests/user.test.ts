import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  academicFieldsByRole,
  createUserSchema,
  formatUserRole,
  manageableRolesByRole,
} from '../src/types/user.ts'

describe('createUserSchema', () => {
  it('creates the API payload with numeric registration and omitted empty optional fields', () => {
    const result = createUserSchema.parse({
      name: 'CarecaHub Student',
      registration: '1000002',
      githubName: '',
      classroom: '',
      email: 'student@carecahub.local',
      password: 'Student@123',
      role: 'mentor',
    })

    assert.deepEqual(result, {
      name: 'CarecaHub Student',
      registration: 1000002,
      githubName: undefined,
      classroom: undefined,
      email: 'student@carecahub.local',
      password: 'Student@123',
      role: 'mentor',
    })
  })

  it('rejects a password without the character groups required by the API', () => {
    const result = createUserSchema.safeParse({
      name: 'CarecaHub Student',
      registration: '1000002',
      email: 'student@carecahub.local',
      password: 'onlyletters',
      role: 'student',
    })

    assert.equal(result.success, false)
  })

  it('defines the manageable roles for every requester role', () => {
    assert.deepEqual(manageableRolesByRole, {
      admin: ['admin', 'teacher', 'mentor', 'student'],
      teacher: ['mentor', 'student'],
      mentor: ['student'],
      student: [],
    })
  })

  it('allows admins and teachers without academic fields', () => {
    for (const role of ['admin', 'teacher'] as const) {
      const result = createUserSchema.safeParse({
        name: 'CarecaHub User',
        email: `${role}@carecahub.local`,
        password: 'Strong@123',
        role,
      })

      assert.equal(result.success, true)
    }
  })

  it('requires registration for mentors and students', () => {
    for (const role of ['mentor', 'student'] as const) {
      const result = createUserSchema.safeParse({
        name: 'CarecaHub User',
        email: `${role}@carecahub.local`,
        password: 'Strong@123',
        role,
      })

      assert.equal(result.success, false)
    }
  })

  it('defines the academic fields shown for each role', () => {
    assert.deepEqual(academicFieldsByRole, {
      admin: [],
      teacher: [],
      mentor: ['registration', 'githubName'],
      student: ['registration', 'githubName', 'classroom'],
    })
  })

  it('formats raw role values for display', () => {
    assert.equal(formatUserRole('admin'), 'Administrador')
    assert.equal(formatUserRole('teacher'), 'Professor')
    assert.equal(formatUserRole('mentor'), 'Monitor')
    assert.equal(formatUserRole('student'), 'Aluno')
  })
})
