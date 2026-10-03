import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { ErrKeys, type UserMetadata } from '@/types'
import { GroupService } from './group.service'

class QueryResult<T> implements PromiseLike<T> {
  constructor(private readonly result: T) {}
  from() {
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
  values() {
    return this
  }
  set() {
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
    if (this.result instanceof Error)
      return Promise.reject(this.result).then(onfulfilled, onrejected)
    return Promise.resolve(this.result).then(onfulfilled, onrejected)
  }
}

function createService(results: unknown[]) {
  const next = () => new QueryResult(results.shift())
  const db = {
    select: next,
    insert: next,
    update: next,
    transaction: async (callback: (tx: unknown) => unknown) => callback(db),
  }
  return new GroupService(
    { db } as never,
    { create: () => ({ log() {}, error() {} }) } as never,
    { findByGroupId: async () => null } as never,
    { getUserDetails: async () => null } as never,
  )
}

const groupId = 'a761f798-c361-4a22-ab01-244dd3b4124a'
const leaderId = '2ed79018-20fe-4fc2-982c-aecb12d32fb0'
const memberId = '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'
const student = (userId: string) => ({ userId, name: 'Student', role: 'student' }) as UserMetadata
const admin = { userId: 'admin-id', name: 'Admin', role: 'admin' } as UserMetadata
const groupRecord = {
  id: groupId,
  friendlyId: 'Grupo 1',
  leaderId,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
}

describe('GroupService.create', () => {
  it('creates a group with the authenticated student as leader and member', async () => {
    const service = createService([
      [{ id: leaderId, groupId: null, status: 'active' }],
      [],
      [groupRecord],
      [],
    ])

    const result = await service.create({ friendlyId: 'Grupo 1' }, student(leaderId))

    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.leaderId, leaderId)
  })
})

describe('GroupService.addUserToGroup', () => {
  it('rejects a seventh active member', async () => {
    const service = createService([
      [{ id: groupId, leaderId }],
      [{ id: memberId, groupId: null, status: 'active' }],
      [{ count: 6 }],
    ])

    const result = await service.addUserToGroup(memberId, groupId, student(leaderId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.limitReached })
  })

  it('forbids a regular member from adding users', async () => {
    const service = createService([[{ id: groupId, leaderId }]])

    const result = await service.addUserToGroup(memberId, groupId, student(memberId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})

describe('GroupService.removeUserFromGroup', () => {
  it('blocks removal of the current leader', async () => {
    const service = createService([[{ id: groupId, leaderId }]])

    const result = await service.removeUserFromGroup(leaderId, groupId, admin)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.resourceInUse })
  })

  it('forbids a regular member from leaving without leader action', async () => {
    const service = createService([[{ id: groupId, leaderId }]])

    const result = await service.removeUserFromGroup(memberId, groupId, student(memberId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})

describe('GroupService.promoteLeader', () => {
  it('promotes an active member and keeps the previous leader in the group', async () => {
    const promoted = { ...groupRecord, leaderId: memberId }
    const service = createService([
      [{ id: groupId, leaderId }],
      [{ id: memberId, groupId, status: 'active' }],
      [promoted],
    ])

    const result = await service.promoteLeader(memberId, groupId, student(leaderId))

    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.leaderId, memberId)
  })

  it('forbids a regular member from promoting another member', async () => {
    const service = createService([[{ id: groupId, leaderId }]])

    const result = await service.promoteLeader(memberId, groupId, student(memberId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})
