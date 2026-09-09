import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { describe, it } from 'vitest'
import { CreateUserDto } from './upsert-user.dto'

function createDto(role: CreateUserDto['role'], registration?: number) {
  return Object.assign(new CreateUserDto(), {
    name: 'CarecaHub User',
    email: `${role}@carecahub.local`,
    password: 'Strong@123',
    role,
    registration,
  })
}

describe('CreateUserDto academic fields', () => {
  it('allows admins and teachers without registration', async () => {
    for (const role of ['admin', 'teacher'] as const) {
      const errors = await validate(createDto(role))
      assert.equal(
        errors.some((error) => error.property === 'registration'),
        false,
      )
    }
  })

  it('requires registration for mentors and students', async () => {
    for (const role of ['mentor', 'student'] as const) {
      const errors = await validate(createDto(role))
      assert.equal(
        errors.some((error) => error.property === 'registration'),
        true,
      )
    }
  })
})
