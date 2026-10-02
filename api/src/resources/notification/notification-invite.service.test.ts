import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { ErrKeys, type UserMetadata } from '@/types'
import { NotificationService } from './notification.service'

class QueryResult<T> implements PromiseLike<T> {
  constructor(private readonly result: T) {}
  from() {
    return this
  }
  leftJoin() {
    return this
  }
  where() {
    return this
  }
  orderBy() {
    return this
  }
  offset() {
    return this
  }
  limit() {
    return this
  }
  for() {
    return this
  }
  values() {
    return this
  }
  returning() {
    return this
  }
  // biome-ignore lint/suspicious/noThenProperty: query builders are intentionally awaitable
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    if (this.result instanceof Error) {
      return Promise.reject(this.result).then(onfulfilled, onrejected)
    }
    return Promise.resolve(this.result).then(onfulfilled, onrejected)
  }
}

function createService(results: unknown[]) {
  const next = () => new QueryResult(results.shift())
  const db = {
    select: next,
    insert: next,
    transaction: async (callback: (tx: unknown) => unknown) => callback(db),
  }
  return new NotificationService({ db } as never)
}

const leaderId = '2ed79018-20fe-4fc2-982c-aecb12d32fb0'
const inviteeId = '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'
const groupId = '9db4a18e-1341-4899-a62b-49c0d92bdd3a'
const inviteId = '085c25ab-0ed1-4e1c-b2a8-e650b9db8a34'
const notificationId = 'a761f798-c361-4a22-ab01-244dd3b4124a'
const createdAt = new Date('2026-09-30T12:00:00.000Z')
const requester = (userId: string) => ({ userId, name: 'Leader', role: 'student' }) as UserMetadata
const group = { id: groupId, friendlyId: 'Grupo 1', leaderId }
const candidate = {
  id: inviteeId,
  groupId: null,
  name: 'Available Student',
  registration: 1234,
  githubName: 'available-student',
  classroom: 'A1',
  email: 'student@example.com',
  role: 'student' as const,
  status: 'active' as const,
  two_factor: false,
  createdAt,
  updatedAt: createdAt,
  deletedAt: null,
}
const invitation = {
  id: inviteId,
  groupId,
  inviterId: leaderId,
  inviteeId,
  status: 'pending' as const,
  respondedAt: null,
  createdAt,
  updatedAt: createdAt,
  deletedAt: null,
}
const notification = {
  id: notificationId,
  userId: inviteeId,
  type: 'group_invite' as const,
  groupInviteId: inviteId,
  readAt: null,
  createdAt,
  updatedAt: createdAt,
  deletedAt: null,
}

describe('NotificationService.findGroupInviteCandidates', () => {
  it('returns paginated eligible students to the group leader', async () => {
    const service = createService([[group], [candidate], [{ count: 1 }]])

    const result = await service.findGroupInviteCandidates(
      { skip: 0, take: 10, search: 'available' },
      requester(leaderId),
    )

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.totalCount, 1)
      assert.deepEqual(result.data[0], {
        id: inviteeId,
        groupId: null,
        name: 'Available Student',
        registration: 1234,
        githubName: 'available-student',
        classroom: 'A1',
        email: 'student@example.com',
        role: 'student',
        status: 'active',
        twoFactor: false,
        createdAt,
        updatedAt: createdAt,
        deletedAt: undefined,
      })
    }
  })

  it('forbids a student who is not a group leader', async () => {
    const service = createService([[]])

    const result = await service.findGroupInviteCandidates(
      { skip: 0, take: 10 },
      requester(inviteeId),
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})

describe('NotificationService.createGroupInvite', () => {
  it('creates the invitation and notification atomically for an eligible student', async () => {
    const service = createService([
      [group],
      [candidate],
      [{ count: 1 }],
      [],
      [invitation],
      [notification],
    ])

    const result = await service.createGroupInvite({ inviteeId }, requester(leaderId))

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.id, notificationId)
      assert.equal(result.groupInvite?.status, 'pending')
      assert.equal(result.groupInvite?.group.id, groupId)
    }
  })

  it('rejects an ineligible grouped student', async () => {
    const service = createService([[group], [{ ...candidate, groupId: 'another-group' }]])

    const result = await service.createGroupInvite({ inviteeId }, requester(leaderId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.invalidPayload })
  })

  it('rejects an invitation when the group already has six active members', async () => {
    const service = createService([[group], [candidate], [{ count: 6 }]])

    const result = await service.createGroupInvite({ inviteeId }, requester(leaderId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.limitReached })
  })

  it('maps a concurrent pending-invitation conflict to alreadyExists', async () => {
    const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' })
    const service = createService([[group], [candidate], [{ count: 1 }], [], uniqueViolation])

    const result = await service.createGroupInvite({ inviteeId }, requester(leaderId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })
})
