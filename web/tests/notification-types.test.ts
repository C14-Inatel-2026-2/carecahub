import { describe, expect, it } from 'vitest'
import { createGroupInviteSchema, respondGroupInviteSchema } from '../src/types/notification'

describe('notification request schemas', () => {
  it('accepts a UUID recipient for a group invitation', () => {
    expect(
      createGroupInviteSchema.parse({
        inviteeId: '48d513dc-5a9e-4f13-9c13-ee27589bb7eb',
      })
    ).toEqual({ inviteeId: '48d513dc-5a9e-4f13-9c13-ee27589bb7eb' })
  })

  it('rejects a malformed recipient ID', () => {
    expect(createGroupInviteSchema.safeParse({ inviteeId: 'student-1' }).success).toBe(false)
  })

  it.each(['accepted', 'rejected'] as const)('accepts the %s response', (status) => {
    expect(respondGroupInviteSchema.parse({ status })).toEqual({ status })
  })

  it.each(['pending', 'cancelled', 'unknown'])('rejects the %s response', (status) => {
    expect(respondGroupInviteSchema.safeParse({ status }).success).toBe(false)
  })
})
