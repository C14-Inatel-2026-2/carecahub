import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { ErrKeys, type UserMetadata } from '@/types'
import { RepositoryService } from './repository.service'

class QueryResult<T> implements PromiseLike<T> {
  constructor(private readonly result: T) {}
  from() {
    return this
  }
  where() {
    return this
  }
  innerJoin() {
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

function createService(
  results: unknown[],
  githubResult: unknown = { success: false, errKey: 'error', message: 'error' },
) {
  const next = () => new QueryResult(results.shift())
  const database = { db: { select: next, insert: next, update: next } }
  const loggerFactory = { create: () => ({ log() {}, info() {}, error() {} }) }
  const githubService = { getRepositoryFromUrl: async () => githubResult }
  return new RepositoryService(database as never, githubService as never, loggerFactory as never)
}

const repositoryId = '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'
const projectId = 'a761f798-c361-4a22-ab01-244dd3b4124a'
const groupId = 'bf81f281-b616-48a7-8391-2f31624b01a0'
const ownerId = '2ed79018-20fe-4fc2-982c-aecb12d32fb0'
const student = (userId = 'member-id') =>
  ({ userId, name: 'Member', role: 'student' }) as UserMetadata

const input = { url: 'https://github.com/acme/api', ownerId, projectId }
const repositoryRecord = {
  id: repositoryId,
  url: input.url,
  ownerId,
  projectId,
  owner: {
    id: ownerId,
    groupId,
    name: 'Owner',
    registration: 123,
    githubName: 'owner',
    classroom: 'A1',
    email: 'owner@example.com',
    role: 'student' as const,
    status: 'active' as const,
    two_factor: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  },
  project: {
    id: projectId,
    groupId,
    projectName: 'CarecaHub',
    repositoryType: 'multirepo' as const,
  },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
}

describe('RepositoryService.upsert', () => {
  it('allows a group member to register a repository with an owner from the group', async () => {
    const service = createService([
      [{ id: projectId, groupId }],
      [{ groupId }],
      [{ id: ownerId, groupId, status: 'active' }],
      [],
      [{ id: repositoryId }],
      [repositoryRecord],
    ])

    const result = await service.upsert(input, student())

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.ownerId, ownerId)
      assert.equal(result.projectId, projectId)
      assert.equal(result.owner.name, 'Owner')
    }
  })

  it('rejects an owner that is not an active member of the project group', async () => {
    const service = createService([
      [{ id: projectId, groupId }],
      [{ groupId }],
      [{ id: ownerId, groupId: 'other-group', status: 'active' }],
    ])

    const result = await service.upsert(input, student())

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.invalidPayload })
  })

  it('forbids a student outside the project group', async () => {
    const service = createService([[{ id: projectId, groupId }], []])

    const result = await service.upsert(input, student('outsider-id'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('rejects a second active repository for a monorepo project', async () => {
    const service = createService([
      [{ id: projectId, groupId, repositoryType: 'monorepo' }],
      [{ groupId }],
      [{ id: ownerId, groupId, status: 'active' }],
      [{ id: 'existing-repository' }],
    ])

    const result = await service.upsert(input, student())

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.resourceInUse })
  })

  it('rejects moving a repository to a monorepo project that already has one', async () => {
    const service = createService([
      [repositoryRecord],
      [{ groupId }],
      [{ id: 'target-project', groupId, repositoryType: 'monorepo' }],
      [{ groupId }],
      [{ id: ownerId, groupId, status: 'active' }],
      [{ id: 'existing-repository' }],
    ])

    const result = await service.upsert(
      { ...input, id: repositoryId, projectId: 'target-project' },
      student(),
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.resourceInUse })
  })
})

describe('RepositoryService.remove', () => {
  it('forbids a regular member from deleting a repository', async () => {
    const service = createService([[{ id: repositoryId, groupId }], [{ leaderId: 'leader-id' }]])

    const result = await service.remove(repositoryId, student())

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('allows the leader to soft delete a repository', async () => {
    const service = createService([
      [{ id: repositoryId, groupId }],
      [{ leaderId: 'leader-id' }],
      [],
    ])

    const result = await service.remove(repositoryId, student('leader-id'))

    assert.deepEqual(result, { ok: true })
  })
})
