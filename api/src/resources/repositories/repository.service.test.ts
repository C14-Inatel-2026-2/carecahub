import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ErrKeys } from '@/types'
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

  return new RepositoryService(database as never, loggerFactory as never)
}

describe('RepositoryService.upsert', () => {
  it('rejects creation when an active repository already uses the URL', async () => {
    const service = createService([[{ id: 'existing-id' }]])

    const result = await service.upsert({
      url: 'https://github.com/acme/api',
      ownerId: '2ed79018-20fe-4fc2-982c-aecb12d32fb0',
      projectId: 'a761f798-c361-4a22-ab01-244dd3b4124a',
    })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })

  it('returns notFound when updating an unknown repository ID', async () => {
    const service = createService([[]])

    const result = await service.upsert({
      id: '48d513dc-5a9e-4f13-9c13-ee27589bb7eb',
      url: 'https://github.com/acme/api',
      ownerId: '2ed79018-20fe-4fc2-982c-aecb12d32fb0',
      projectId: 'a761f798-c361-4a22-ab01-244dd3b4124a',
    })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('rejects an update when another repository already uses the URL', async () => {
    const service = createService([
      [{ id: '48d513dc-5a9e-4f13-9c13-ee27589bb7eb' }],
      [{ id: 'another-id' }],
    ])

    const result = await service.upsert({
      id: '48d513dc-5a9e-4f13-9c13-ee27589bb7eb',
      url: 'https://github.com/acme/api',
      ownerId: '2ed79018-20fe-4fc2-982c-aecb12d32fb0',
      projectId: 'a761f798-c361-4a22-ab01-244dd3b4124a',
    })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })

  it('maps a concurrent unique constraint violation to alreadyExists', async () => {
    const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' })
    const service = createService([[], uniqueViolation])

    const result = await service.upsert({
      url: 'https://github.com/acme/api',
      ownerId: '2ed79018-20fe-4fc2-982c-aecb12d32fb0',
      projectId: 'a761f798-c361-4a22-ab01-244dd3b4124a',
    })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })
})
