import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ErrKeys } from '@/types'
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
    if (this.result instanceof Error) {
      return Promise.reject(this.result).then(onfulfilled, onrejected)
    }
    return Promise.resolve(this.result).then(onfulfilled, onrejected)
  }
}

function createService(results: unknown[]) {
  const next = () => new QueryResult(results.shift())
  const database = {
    db: {
      select: next,
      insert: next,
      update: next,
    },
  }
  const loggerFactory = {
    create: () => ({ log() {}, info() {}, error() {} }),
  }

  return new ProjectService(database as never, loggerFactory as never)
}

const projectId = '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'
const requester = { id: '2ed79018-20fe-4fc2-982c-aecb12d32fb0', role: 'admin' }

const projectRecord = {
  id: projectId,
  projectName: 'CarecaHub',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  deletedAt: null,
}

describe('ProjectService.upsert', () => {
  it('rejects creation when an active project already uses the name', async () => {
    const service = createService([[{ id: 'existing-id' }]])

    const result = await service.upsert({ projectName: 'CarecaHub' })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })

  it('creates a project when the name is free', async () => {
    const service = createService([[], [{ id: projectId }], [projectRecord]])

    const result = await service.upsert({ projectName: 'CarecaHub' })

    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.projectName, 'CarecaHub')
  })

  it('returns notFound when updating an unknown project ID', async () => {
    const service = createService([[]])

    const result = await service.upsert({ id: projectId, projectName: 'CarecaHub' })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('rejects an update when another active project already uses the name', async () => {
    const service = createService([[{ id: projectId }], [{ id: 'another-id' }]])

    const result = await service.upsert({ id: projectId, projectName: 'CarecaHub' })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })

  it('maps a concurrent unique constraint violation to alreadyExists', async () => {
    const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' })
    const service = createService([[], uniqueViolation])

    const result = await service.upsert({ projectName: 'CarecaHub' })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })
})

describe('ProjectService.findOne', () => {
  it('returns notFound for a soft deleted project', async () => {
    const service = createService([[]])

    const result = await service.findOne(projectId)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })
})

describe('ProjectService.remove', () => {
  it('returns notFound when the project does not exist', async () => {
    const service = createService([[]])

    const result = await service.remove(projectId, requester as never)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('soft deletes an existing project', async () => {
    const service = createService([[{ id: projectId }], []])

    const result = await service.remove(projectId, requester as never)

    assert.deepEqual(result, { ok: true })
  })
})