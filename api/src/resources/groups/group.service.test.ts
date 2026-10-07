import assert from 'node:assert/strict'
import { groups } from '@db'
import { and, asc, isNull } from 'drizzle-orm'
import { describe, it } from 'vitest'
import { ErrKeys, type UserMetadata } from '@/types'
import { GroupService } from './group.service'

type QueryLogEntry = { op: string; arg?: unknown }

class QueryResult<T> implements PromiseLike<T> {
  constructor(
    private readonly result: T,
    private readonly log: QueryLogEntry[] = [],
  ) {}
  from() {
    return this
  }
  where(arg?: unknown) {
    this.log.push({ op: 'where', arg })
    return this
  }
  orderBy(arg?: unknown) {
    this.log.push({ op: 'orderBy', arg })
    return this
  }
  offset(arg?: unknown) {
    this.log.push({ op: 'offset', arg })
    return this
  }
  limit(arg?: unknown) {
    this.log.push({ op: 'limit', arg })
    return this
  }
  values(arg?: unknown) {
    this.log.push({ op: 'values', arg })
    return this
  }
  set(arg?: unknown) {
    this.log.push({ op: 'set', arg })
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
  const queryLog: QueryLogEntry[] = []
  const next = () => {
    if (results.length === 0) {
      throw new Error('Unexpected extra database call: the service queried more than expected')
    }
    return new QueryResult(results.shift(), queryLog)
  }
  const db = {
    select: next,
    insert: next,
    update: next,
    transaction: async (callback: (tx: unknown) => unknown) => {
      queryLog.push({ op: 'transaction' })
      return callback(db)
    },
  }
  const service = new GroupService(
    { db } as never,
    { create: () => ({ log() {}, error() {} }) } as never,
    { findByGroupId: async () => null } as never,
    { getUserDetails: async () => null } as never,
  ) as GroupService & { queryLog: QueryLogEntry[] }
  service.queryLog = queryLog
  return service
}

function serialize(value: unknown): string {
  return JSON.stringify(value, (key, val) => (key === 'table' ? undefined : val))
}

const groupId = 'a761f798-c361-4a22-ab01-244dd3b4124a'
const otherGroupId = '0c6b1c0e-6f4d-4f6e-9c5b-6a7f6d4f1a11'
const leaderId = '2ed79018-20fe-4fc2-982c-aecb12d32fb0'
const memberId = '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'
const student = (userId: string) => ({ userId, name: 'Student', role: 'student' }) as UserMetadata
const admin = { userId: 'admin-id', name: 'Admin', role: 'admin' } as UserMetadata
const teacher = { userId: 'teacher-id', name: 'Teacher', role: 'teacher' } as UserMetadata
const groupRecord = {
  id: groupId,
  friendlyId: 'Grupo 1',
  leaderId,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
}
const userRow = (overrides: Record<string, unknown> = {}) => ({
  id: memberId,
  groupId,
  name: 'Member',
  registration: 123456,
  githubName: null,
  classroom: 'A',
  email: 'member@example.com',
  role: 'student',
  status: 'active',
  two_factor: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  deletedAt: null,
  ...overrides,
})
const userDto = (overrides: Record<string, unknown> = {}) => ({
  id: memberId,
  groupId,
  name: 'Member',
  registration: 123456,
  githubName: null,
  classroom: 'A',
  email: 'member@example.com',
  role: 'student',
  status: 'active',
  twoFactor: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  deletedAt: undefined,
  ...overrides,
})

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

  it('returns the public group DTO and writes the group and leader link in one transaction', async () => {
    const service = createService([
      [{ id: leaderId, groupId: null, status: 'active' }],
      [],
      [groupRecord],
      [],
    ])

    const result = await service.create({ friendlyId: 'Grupo 1' }, student(leaderId))

    assert.deepEqual(result, {
      ok: true,
      id: groupId,
      friendlyId: 'Grupo 1',
      leaderId,
      tags: ['space_available', 'no_project'],
      members: [],
      project: null,
      createdAt: groupRecord.createdAt,
      updatedAt: groupRecord.updatedAt,
      deletedAt: undefined,
    })
    const ops = service.queryLog.map((entry) => entry.op)
    assert.equal(ops.filter((op) => op === 'transaction').length, 1)
    assert.deepEqual(service.queryLog.find((entry) => entry.op === 'values')?.arg, {
      friendlyId: 'Grupo 1',
      leaderId,
    })
    assert.deepEqual(
      service.queryLog.filter((entry) => entry.op === 'set').map((entry) => entry.arg),
      [{ groupId }],
    )
  })

  it.each([
    ['admin', admin],
    ['teacher', teacher],
  ])(
    'forbids a %s from creating a group without querying the database',
    async (_role, requester) => {
      const service = createService([])

      const result = await service.create({ friendlyId: 'Grupo 1' }, requester)

      assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
      assert.deepEqual(service.queryLog, [])
    },
  )

  it('rejects when the friendlyId is already in use by an active group', async () => {
    const service = createService([
      [{ id: leaderId, groupId: null, status: 'active' }],
      [{ id: otherGroupId }],
    ])

    const result = await service.create({ friendlyId: 'Grupo 1' }, student(leaderId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
    assert.equal(service.queryLog.filter((entry) => entry.op === 'transaction').length, 0)
  })

  it('maps a database unique violation to alreadyExists', async () => {
    const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' })
    const service = createService([
      [{ id: leaderId, groupId: null, status: 'active' }],
      [],
      uniqueViolation,
    ])

    const result = await service.create({ friendlyId: 'Grupo 1' }, student(leaderId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })

  it('propagates an unexpected database error instead of reporting success', async () => {
    const dbError = Object.assign(new Error('connection reset'), { code: '08006' })
    const service = createService([
      [{ id: leaderId, groupId: null, status: 'active' }],
      [],
      dbError,
    ])

    await assert.rejects(
      () => service.create({ friendlyId: 'Grupo 1' }, student(leaderId)),
      dbError,
    )
  })
})

describe('GroupService.findAll', () => {
  it('lists groups with their members and the total count', async () => {
    const service = createService([[groupRecord], [{ count: 1 }], [userRow()]])

    const result = await service.findAll({ skip: 0, take: 20 }, admin)

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.totalCount, 1)
      assert.equal(result.data.length, 1)
      assert.equal(result.data[0]?.id, groupId)
      assert.equal(result.data[0]?.friendlyId, 'Grupo 1')
      assert.deepEqual(result.data[0]?.tags, ['space_available', 'no_project'])
      assert.deepEqual(result.data[0]?.members, [{ ...userDto(), gitHubDetails: null }])
      assert.equal(result.data[0]?.project, null)
    }
  })

  it('returns an empty list when there are no groups', async () => {
    const service = createService([[], [{ count: 0 }]])

    const result = await service.findAll({ skip: 0, take: 20 }, admin)

    assert.deepEqual(result, { ok: true, totalCount: 0, data: [] })
  })

  it('applies skip and take as offset and limit', async () => {
    const service = createService([[], [{ count: 0 }]])

    await service.findAll({ skip: 40, take: 10 }, admin)

    assert.deepEqual(
      service.queryLog.filter((entry) => entry.op === 'offset'),
      [{ op: 'offset', arg: 40 }],
    )
    assert.deepEqual(
      service.queryLog.filter((entry) => entry.op === 'limit'),
      [{ op: 'limit', arg: 10 }],
    )
  })

  it('orders groups by friendlyId ascending', async () => {
    const service = createService([[], [{ count: 0 }]])

    await service.findAll({ skip: 0, take: 20 }, admin)

    const orderBy = service.queryLog.filter((entry) => entry.op === 'orderBy')
    assert.equal(orderBy.length, 1)
    assert.equal(serialize(orderBy[0]?.arg), serialize(asc(groups.friendlyId)))
  })

  it('includes the group identifier and active member names in the group search filter', async () => {
    const service = createService([[], [{ count: 0 }]])

    await service.findAll({ skip: 0, take: 20, search: 'abc' }, admin)

    const wheres = service.queryLog.filter((entry) => entry.op === 'where')
    assert.equal(wheres.length, 2)
    for (const where of wheres) {
      const filter = serialize(where.arg)
      assert.match(filter, /friendly_id/)
      assert.match(filter, /group_id/)
      assert.match(filter, /name/)
    }
  })

  it('includes active member names when searching groups', async () => {
    const service = createService([[], [{ count: 0 }]])

    await service.findAll({ skip: 0, take: 20, search: 'Ada' }, admin)

    const wheres = service.queryLog.filter((entry) => entry.op === 'where')
    for (const where of wheres) {
      assert.match(serialize(where.arg), /name/)
    }
  })

  it('includes projects and repositories in the project search scope', async () => {
    const service = createService([[], [{ count: 0 }]])

    await service.findAll({
      skip: 0,
      take: 20,
      search: 'carecahub',
      searchScope: 'projects',
    } as QueryDto, admin)

    const wheres = service.queryLog.filter((entry) => entry.op === 'where')
    for (const where of wheres) {
      const query = serialize(where.arg)
      assert.match(query, /project_name/)
      assert.match(query, /Repository/)
    }
  })

  it('only excludes soft deleted groups when there is no search term', async () => {
    const service = createService([[], [{ count: 0 }]])

    await service.findAll({ skip: 0, take: 20 }, admin)

    const expected = serialize(and(isNull(groups.deletedAt), undefined))
    const wheres = service.queryLog.filter((entry) => entry.op === 'where')
    assert.equal(wheres.length, 2)
    for (const where of wheres) assert.equal(serialize(where.arg), expected)
  })

  it('does not hide groups from the listing based on the requester role', async () => {
    const service = createService([[groupRecord], [{ count: 1 }], []])

    const result = await service.findAll({ skip: 0, take: 20 }, teacher)

    assert.equal(result.ok, true)
  })
})

describe('GroupService.findUsersInGroup', () => {
  it('lists the members of a group', async () => {
    const service = createService([[groupRecord], [userRow()]])

    const result = await service.findUsersInGroup(groupId, admin)

    assert.deepEqual(result, {
      ok: true,
      totalCount: 1,
      data: [{ ...userDto(), gitHubDetails: null }],
    })
  })

  it('returns an empty list for a group without members', async () => {
    const service = createService([[groupRecord], []])

    const result = await service.findUsersInGroup(groupId, admin)

    assert.deepEqual(result, { ok: true, totalCount: 0, data: [] })
  })

  it('returns notFound for a group that does not exist', async () => {
    const service = createService([[]])

    const result = await service.findUsersInGroup(groupId, admin)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('allows a student to list the members of their own group', async () => {
    const service = createService([[{ groupId }], [groupRecord], [userRow()]])

    const result = await service.findUsersInGroup(groupId, student(memberId))

    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.totalCount, 1)
  })

  it('forbids a student without a link to the group and stops after the access check', async () => {
    const service = createService([[{ groupId: otherGroupId }]])

    const result = await service.findUsersInGroup(groupId, student(memberId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('forbids a student who is not in any group', async () => {
    const service = createService([[{ groupId: null }]])

    const result = await service.findUsersInGroup(groupId, student(memberId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})

describe('GroupService.addUserToGroup', () => {
  it('adds an active user without a group and returns the public user DTO', async () => {
    const service = createService([
      [{ id: groupId, leaderId }],
      [{ id: memberId, groupId: null, status: 'active' }],
      [{ count: 1 }],
      [userRow()],
    ])

    const result = await service.addUserToGroup(memberId, groupId, student(leaderId))

    assert.deepEqual(result, { ok: true, ...userDto() })
    const setArgs = service.queryLog
      .filter((entry) => entry.op === 'set')
      .map((entry) => entry.arg as Record<string, unknown>)
    assert.equal(setArgs.length, 1)
    assert.equal(setArgs[0]?.groupId, groupId)
  })

  it('allows an admin to add a user to any group', async () => {
    const service = createService([
      [{ id: groupId, leaderId }],
      [{ id: memberId, groupId: null, status: 'active' }],
      [{ count: 1 }],
      [userRow()],
    ])

    const result = await service.addUserToGroup(memberId, groupId, admin)

    assert.equal(result.ok, true)
  })

  it('returns notFound when the group does not exist', async () => {
    const service = createService([[]])

    const result = await service.addUserToGroup(memberId, groupId, student(leaderId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('returns notFound when the user does not exist', async () => {
    const service = createService([[{ id: groupId, leaderId }], []])

    const result = await service.addUserToGroup(memberId, groupId, student(leaderId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('rejects a seventh active member', async () => {
    const service = createService([
      [{ id: groupId, leaderId }],
      [{ id: memberId, groupId: null, status: 'active' }],
      [{ count: 6 }],
    ])

    const result = await service.addUserToGroup(memberId, groupId, student(leaderId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.limitReached })
  })

  it('forbids a regular member from adding users and stops after the access check', async () => {
    const service = createService([[{ id: groupId, leaderId }]])

    const result = await service.addUserToGroup(memberId, groupId, student(memberId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
    assert.equal(service.queryLog.filter((entry) => entry.op === 'set').length, 0)
  })

  it('currently throws when the update returns no row instead of returning an error', async () => {
    const service = createService([
      [{ id: groupId, leaderId }],
      [{ id: memberId, groupId: null, status: 'active' }],
      [{ count: 1 }],
      [],
    ])

    await assert.rejects(
      () => service.addUserToGroup(memberId, groupId, student(leaderId)),
      TypeError,
    )
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

describe('GroupService.leave', () => {
  it('unlinks a regular member without changing the group leadership', async () => {
    const service = createService([
      [groupRecord],
      [{ id: leaderId }, { id: memberId }],
      [],
    ])

    const result = await service.leave(groupId, student(memberId))

    assert.deepEqual(result, { ok: true })
    assert.equal(service.queryLog.filter((entry) => entry.op === 'transaction').length, 1)
    const updates = service.queryLog.filter((entry) => entry.op === 'set').map((entry) => entry.arg as Record<string, unknown>)
    assert.equal(updates.length, 1)
    assert.equal(updates[0]?.groupId, null)
    assert.equal(updates[0]?.leaderId, undefined)
  })

  it('transfers leadership before unlinking a departing leader who has teammates', async () => {
    const service = createService([
      [groupRecord],
      [{ id: leaderId }, { id: memberId }],
      [],
      [],
    ])

    const result = await service.leave(groupId, student(leaderId))

    assert.deepEqual(result, { ok: true })
    const updates = service.queryLog.filter((entry) => entry.op === 'set').map((entry) => entry.arg as Record<string, unknown>)
    assert.equal(updates[0]?.leaderId, memberId)
    assert.equal(updates[1]?.groupId, null)
  })

  it('soft deletes the project and group when the final member leaves', async () => {
    const service = createService([
      [groupRecord],
      [{ id: leaderId }],
      [],
      [],
      [],
    ])

    const result = await service.leave(groupId, student(leaderId))

    assert.deepEqual(result, { ok: true })
    const updates = service.queryLog.filter((entry) => entry.op === 'set').map((entry) => entry.arg as Record<string, unknown>)
    assert.ok(updates[0]?.deletedAt instanceof Date)
    assert.ok(updates[1]?.deletedAt instanceof Date)
    assert.equal(updates[2]?.groupId, null)
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

describe('GroupService.delete', () => {
  it('soft deletes the group and unlinks its users in the same transaction', async () => {
    const service = createService([
      [{ id: groupId, leaderId }],
      [],
      [{ id: groupId }],
      [{ id: memberId }],
    ])

    const result = await service.delete(groupId, student(leaderId))

    assert.deepEqual(result, { ok: true })
    const ops = service.queryLog.map((entry) => entry.op)
    assert.equal(ops.filter((op) => op === 'transaction').length, 1)
    const transactionIndex = ops.indexOf('transaction')
    const sets = service.queryLog
      .map((entry, index) => ({ ...entry, index }))
      .filter((entry) => entry.op === 'set')
    assert.equal(sets.length, 2)
    assert.ok(sets.every((entry) => entry.index > transactionIndex))
    const setArgs = sets.map((entry) => entry.arg as Record<string, unknown>)
    assert.ok(setArgs[0]?.deletedAt instanceof Date)
    assert.equal(setArgs[1]?.groupId, null)
  })

  it('allows an admin to delete any group', async () => {
    const service = createService([[{ id: groupId, leaderId }], [], [], []])

    const result = await service.delete(groupId, admin)

    assert.deepEqual(result, { ok: true })
  })

  it('returns notFound for a group that does not exist or was already removed', async () => {
    const service = createService([[]])

    const result = await service.delete(groupId, admin)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
    assert.equal(service.queryLog.filter((entry) => entry.op === 'transaction').length, 0)
  })

  it('forbids a regular member and does not write anything', async () => {
    const service = createService([[{ id: groupId, leaderId }]])

    const result = await service.delete(groupId, student(memberId))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
    assert.equal(service.queryLog.filter((entry) => entry.op === 'transaction').length, 0)
    assert.equal(service.queryLog.filter((entry) => entry.op === 'set').length, 0)
  })

  it('blocks deletion while the group has an active project', async () => {
    const service = createService([[{ id: groupId, leaderId }], [{ id: 'project-id' }]])

    const result = await service.delete(groupId, admin)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.resourceInUse })
    assert.equal(service.queryLog.filter((entry) => entry.op === 'transaction').length, 0)
  })

  it('propagates a transaction failure instead of reporting success', async () => {
    const txError = new Error('transaction aborted')
    const service = createService([[{ id: groupId, leaderId }], [], txError])

    await assert.rejects(() => service.delete(groupId, admin), txError)
  })
})
