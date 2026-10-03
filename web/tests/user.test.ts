import { describe, expect, it } from 'vitest'
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

    expect(result).toEqual({
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

    expect(result.success).toBe(false)
  })

  it('defines the manageable roles for every requester role', () => {
    expect(manageableRolesByRole).toEqual({
      admin: ['admin', 'teacher', 'mentor', 'student'],
      teacher: [],
      mentor: [],
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

      expect(result.success).toBe(true)
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

      expect(result.success).toBe(false)
    }
  })

  it('defines the academic fields shown for each role', () => {
    expect(academicFieldsByRole).toEqual({
      admin: [],
      teacher: [],
      mentor: ['registration', 'githubName'],
      student: ['registration', 'githubName', 'classroom'],
    })
  })

  it('formats raw role values for display', () => {
    expect(formatUserRole('admin')).toBe('Administrador')
    expect(formatUserRole('teacher')).toBe('Professor')
    expect(formatUserRole('mentor')).toBe('Monitor')
    expect(formatUserRole('student')).toBe('Aluno')
  })
})
