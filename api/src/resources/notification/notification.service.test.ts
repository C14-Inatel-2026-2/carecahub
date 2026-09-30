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
  set() {
    return this
  }
  // biome-ignore lint/suspicious/noThenProperty: query builders are intentionally awaitable
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected)
  }
}

function createService(results: unknown[]) {
  const next = () => new QueryResult(results.shift())
  return new NotificationService({ db: { select: next, update: next } } as never)
}

const recipientId = '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'
const otherUserId = '2ed79018-20fe-4fc2-982c-aecb12d32fb0'
const notificationId = 'a761f798-c361-4a22-ab01-244dd3b4124a'
const inviteId = '085c25ab-0ed1-4e1c-b2a8-e650b9db8a34'
const groupId = '9db4a18e-1341-4899-a62b-49c0d92bdd3a'
const requester = (userId: string) => ({ userId, name: 'Student', role: 'student' }) as UserMetadata
const createdAt = new Date('2026-09-30T12:00:00.000Z')
const row = {
  notification: {
    id: notificationId,
    userId: recipientId,
    type: 'group_invite' as const,
    groupInviteId: inviteId,
    readAt: null,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  },
  groupInvite: {
    id: inviteId,
    groupId,
    inviterId: otherUserId,
    inviteeId: recipientId,
    status: 'pending' as const,
    respondedAt: null,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  },
  group: { id: groupId, friendlyId: 'Grupo 1' },
  inviter: { id: otherUserId, name: 'Leader' },
}

describe('NotificationService.findAll', () => {
  it('returns the recipient inbox with counts and aggregated invitation data', async () => {
    const service = createService([[row], [{ count: 1 }], [{ count: 1 }]])

    const result = await service.findAll({ skip: 0, take: 10 }, requester(recipientId))

    assert.deepEqual(result, {
      ok: true,
      totalCount: 1,
      unreadCount: 1,
      data: [
        {
          id: notificationId,
          type: 'group_invite',
          readAt: null,
          groupInvite: {
            id: inviteId,
            status: 'pending',
            respondedAt: null,
            group: { id: groupId, friendlyId: 'Grupo 1' },
            inviter: { id: otherUserId, name: 'Leader' },
          },
          createdAt,
          updatedAt: createdAt,
          deletedAt: undefined,
        },
      ],
    })
  })
})

describe('NotificationService.markAsRead', () => {
  it('marks an unread notification owned by the requester', async () => {
    const service = createService([[row], []])

    const result = await service.markAsRead(notificationId, requester(recipientId))

    assert.equal(result.ok, true)
    if (result.ok) assert.ok(result.readAt instanceof Date)
  })

  it('keeps an already-read notification idempotent', async () => {
    const readAt = new Date('2026-09-30T13:00:00.000Z')
    const service = createService([[{ ...row, notification: { ...row.notification, readAt } }]])

    const result = await service.markAsRead(notificationId, requester(recipientId))

    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.readAt, readAt)
  })

  it('does not reveal a missing notification', async () => {
    const service = createService([[]])

    const result = await service.markAsRead(notificationId, requester(recipientId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('forbids another user from marking the notification', async () => {
    const service = createService([[row]])

    const result = await service.markAsRead(notificationId, requester(otherUserId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})
