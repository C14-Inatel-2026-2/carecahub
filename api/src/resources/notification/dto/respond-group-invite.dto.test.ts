import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { describe, it } from 'vitest'
import { RespondGroupInviteDto } from './group-invite.dto'

describe('RespondGroupInviteDto', () => {
  it('accepts only final user-selected statuses', async () => {
    for (const status of ['accepted', 'rejected']) {
      const input = Object.assign(new RespondGroupInviteDto(), { status })
      assert.deepEqual(await validate(input), [])
    }
  })

  it('rejects pending, cancelled, arbitrary, and missing statuses', async () => {
    for (const status of ['pending', 'cancelled', 'unknown', undefined]) {
      const input = Object.assign(new RespondGroupInviteDto(), { status })
      const errors = await validate(input)
      assert.equal(
        errors.some((error) => error.property === 'status'),
        true,
      )
    }
  })
})
