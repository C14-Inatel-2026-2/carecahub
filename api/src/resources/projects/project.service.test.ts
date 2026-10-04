import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { ErrKeys, type UserMetadata } from '@/types'
import { ProjectService } from './project.service'

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

function createService(results: unknown[], githubResults: unknown[] = []) {
  const next = () => new QueryResult(results.shift())
  const database = { db: { select: next, insert: next, update: next } }
  const gitHubService = { getRepositoryFromUrl: async () => githubResults.shift() }
  const loggerFactory = { create: () => ({ log() {}, info() {}, error() {} }) }
  return new ProjectService(database as never, gitHubService as never, loggerFactory as never)
}

const projectId = '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'
const groupId = 'a761f798-c361-4a22-ab01-244dd3b4124a'
const student = (userId = 'member-id') =>
  ({ userId, name: 'Member', role: 'student' }) as UserMetadata
const admin = { userId: 'admin-id', name: 'Admin', role: 'admin' } as UserMetadata

const input = {
  name: 'CarecaHub',
  description: 'Plataforma de projetos',
  technologies: ['typescript'],
  usesOtherTechnology: false,
  otherTechnology: '',
  dependencyManager: 'pnpm',
  otherDependencyManager: '',
  versionControl: 'git',
  otherVersionControl: '',
  repositoryType: 'multirepo' as const,
}

const projectRecord = {
  id: projectId,
  groupId,
  projectName: input.name,
  description: input.description,
  technologies: input.technologies,
  usesOtherTechnology: input.usesOtherTechnology,
  otherTechnology: null,
  dependencyManager: input.dependencyManager,
  otherDependencyManager: null,
  versionControl: input.versionControl,
  otherVersionControl: null,
  repositoryType: input.repositoryType,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  deletedAt: null,
}

describe('ProjectService.upsert', () => {
  it('allows a group member to create the group project', async () => {
    const service = createService([
      [{ groupId, status: 'active' }],
      [{ id: groupId }],
      [],
      [],
      [{ id: projectId }],
      [projectRecord],
      [],
    ])

    const result = await service.upsert(input, student())

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.groupId, groupId)
      assert.equal(result.projectName, input.name)
      assert.equal(result.description, input.description)
    }
  })

  it('forbids a teacher from creating a project', async () => {
    const service = createService([])

    const result = await service.upsert(input, {
      userId: 'teacher-id',
      name: 'Teacher',
      role: 'teacher',
    })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('forbids a student from editing another group project', async () => {
    const service = createService([[projectRecord], []])

    const result = await service.upsert({ ...input, id: projectId }, student('outsider-id'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})

describe('ProjectService.findOne', () => {
  it('sums commits and branches from every active repository', async () => {
    const repositories = [
      {
        id: 'repo-1',
        url: 'https://github.com/acme/web',
        ownerId: 'member-id',
        projectId,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      {
        id: 'repo-2',
        url: 'https://github.com/acme/api',
        ownerId: 'member-id',
        projectId,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
    ]
    const service = createService(
      [[projectRecord], repositories],
      [
        { success: true, commitCount: 12, branches: [{ name: 'main' }, { name: 'dev' }] },
        { success: true, commitCount: 8, branches: [{ name: 'main' }] },
      ],
    )

    const result = await service.findOne(projectId, admin)

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.commitCount, 20)
      assert.equal(result.branchCount, 3)
      assert.deepEqual(result.tags, ['multirepo'])
    }
  })

  it('forbids a student from another group from reading a project', async () => {
    const service = createService([
      [projectRecord],
      [{ groupId: 'another-group-id', status: 'active' }],
    ])

    const result = await service.findOne(projectId, student('outsider-id'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})

describe('ProjectService.remove', () => {
  it('forbids a regular member from deleting the project', async () => {
    const service = createService([[{ id: projectId, groupId }], [{ leaderId: 'leader-id' }]])

    const result = await service.remove(projectId, student('member-id'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('allows the group leader to soft delete the project', async () => {
    const service = createService([[{ id: projectId, groupId }], [{ leaderId: 'leader-id' }], []])

    const result = await service.remove(projectId, student('leader-id'))

    assert.deepEqual(result, { ok: true })
  })
})

describe('ProjectService.findAll', () => {
  it('returns an empty list for a student without a group', async () => {
    const service = createService([[{ groupId: null, status: 'active' }]])

    const result = await service.findAll({ skip: 0, take: 10 } as never, student())

    assert.deepEqual(result, { ok: true, totalCount: 0, data: [] })
  })
})