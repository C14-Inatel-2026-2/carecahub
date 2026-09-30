import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { describe, it } from 'vitest'
import { CreateGroupInviteDto } from './group-invite.dto'

describe('CreateGroupInviteDto', () => {
  it('accepts a UUID recipient', async () => {
    const input = Object.assign(new CreateGroupInviteDto(), {
      inviteeId: '48d513dc-5a9e-4f13-9c13-ee27589bb7eb',
    })

    assert.deepEqual(await validate(input), [])
  })

  it('rejects missing and malformed recipient IDs', async () => {
    const missing = await validate(new CreateGroupInviteDto())
    const malformed = await validate(
      Object.assign(new CreateGroupInviteDto(), { inviteeId: 'student-1' }),
    )

    assert.equal(
      missing.some((error) => error.property === 'inviteeId'),
      true,
    )
    assert.equal(
      malformed.some((error) => error.property === 'inviteeId'),
      true,
    )
  })
})
