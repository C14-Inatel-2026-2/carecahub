import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { ErrKeys, type UserMetadata } from '@/types'
import { NotificationService } from './notification.service'

type Tracker = { locks: string[]; writes: Record<string, unknown>[] }

class QueryResult<T> implements PromiseLike<T> {
  constructor(
    private readonly result: T,
    private readonly selectedFields: Record<string, unknown> | undefined,
    private readonly tracker: Tracker,
  ) {}
  from() {
    return this
  }
  innerJoin() {
    return this
  }
  where() {
    return this
  }
  for() {
    const fields = Object.keys(this.selectedFields ?? {})
    this.tracker.locks.push(
      fields.includes('groupInvite') ? 'invite' : fields.includes('groupId') ? 'user' : 'group',
    )
    return this
  }
  set(values: Record<string, unknown>) {
    this.tracker.writes.push(values)
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
  const tracker: Tracker = { locks: [], writes: [] }
  const next = (fields?: Record<string, unknown>) =>
    new QueryResult(results.shift(), fields, tracker)
  const db = {
    select: next,
    update: () => next(),
    transaction: async (callback: (tx: unknown) => unknown) => callback(db),
  }
  return { service: new NotificationService({ db } as never, {} as never), tracker }
}

const recipientId = '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'
const otherUserId = '2ed79018-20fe-4fc2-982c-aecb12d32fb0'
const groupId = '9db4a18e-1341-4899-a62b-49c0d92bdd3a'
const inviteId = '085c25ab-0ed1-4e1c-b2a8-e650b9db8a34'
const notificationId = 'a761f798-c361-4a22-ab01-244dd3b4124a'
const requester = (userId: string) => ({ userId, name: 'Student', role: 'student' }) as UserMetadata
const context = {
  groupInvite: {
    id: inviteId,
    groupId,
    inviterId: otherUserId,
    inviteeId: recipientId,
    status: 'pending' as const,
  },
  notification: { id: notificationId, userId: recipientId },
}
const invitee = { id: recipientId, groupId: null, status: 'active' as const }
const group = { id: groupId, friendlyId: 'Grupo 1', deletedAt: null }

describe('NotificationService.respondToGroupInvite', () => {
  it('rejects a pending invitation and resolves its notification', async () => {
    const { service, tracker } = createService([[context], [context], [], []])

    const result = await service.respondToGroupInvite(
      inviteId,
      { status: 'rejected' },
      requester(recipientId),
    )

    assert.deepEqual(result, { ok: true, id: inviteId, status: 'rejected', groupId: null })
    assert.equal(tracker.writes[0]?.status, 'rejected')
    assert.ok(tracker.writes[0]?.respondedAt instanceof Date)
    assert.ok(tracker.writes[1]?.readAt instanceof Date)
    assert.deepEqual(tracker.locks, ['invite'])
  })

  it('forbids a user who is not the invitation recipient', async () => {
    const { service, tracker } = createService([[context]])

    const result = await service.respondToGroupInvite(
      inviteId,
      { status: 'accepted' },
      requester(otherUserId),
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
    assert.equal(tracker.writes.length, 0)
  })

  it('rejects an invitation that is no longer pending', async () => {
    const resolved = {
      ...context,
      groupInvite: { ...context.groupInvite, status: 'rejected' as const },
    }
    const { service, tracker } = createService([[resolved]])

    const result = await service.respondToGroupInvite(
      inviteId,
      { status: 'accepted' },
      requester(recipientId),
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.invalidPayload })
    assert.equal(tracker.writes.length, 0)
  })

  it('accepts with student-first/group-second locks and cancels other received invites', async () => {
    const otherInviteId = 'b34fecc6-f04b-442d-9d20-f7e269f52237'
    const { service, tracker } = createService([
      [context],
      [invitee],
      [group],
      [context],
      [{ count: 2 }],
      [],
      [],
      [],
      [{ id: otherInviteId }],
      [],
      [],
    ])

    const result = await service.respondToGroupInvite(
      inviteId,
      { status: 'accepted' },
      requester(recipientId),
    )

    assert.deepEqual(result, { ok: true, id: inviteId, status: 'accepted', groupId })
    assert.deepEqual(tracker.locks, ['user', 'group', 'invite'])
    assert.equal(
      tracker.writes.some((write) => write.groupId === groupId),
      true,
    )
    assert.equal(tracker.writes.filter((write) => write.status === 'cancelled').length, 1)
  })

  it('does not write when the student joined another group before accepting', async () => {
    const { service, tracker } = createService([
      [context],
      [{ ...invitee, groupId: 'another-group' }],
    ])

    const result = await service.respondToGroupInvite(
      inviteId,
      { status: 'accepted' },
      requester(recipientId),
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.invalidPayload })
    assert.equal(tracker.writes.length, 0)
  })

  it('does not write when the group is already full', async () => {
    const { service, tracker } = createService([
      [context],
      [invitee],
      [group],
      [context],
      [{ count: 6 }],
    ])

    const result = await service.respondToGroupInvite(
      inviteId,
      { status: 'accepted' },
      requester(recipientId),
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.limitReached })
    assert.equal(tracker.writes.length, 0)
  })

  it('cancels the remaining group invitations when acceptance fills the group', async () => {
    const otherInviteId = 'b34fecc6-f04b-442d-9d20-f7e269f52237'
    const { service, tracker } = createService([
      [context],
      [invitee],
      [group],
      [context],
      [{ count: 5 }],
      [],
      [],
      [],
      [],
      [{ id: otherInviteId }],
      [],
      [],
    ])

    const result = await service.respondToGroupInvite(
      inviteId,
      { status: 'accepted' },
      requester(recipientId),
    )

    assert.equal(result.ok, true)
    assert.equal(tracker.writes.filter((write) => write.status === 'cancelled').length, 1)
  })
})
