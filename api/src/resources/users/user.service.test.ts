import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ErrKeys } from '@/types'
import { UsersService } from './user.service'

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

  // biome-ignore lint/suspicious/noThenProperty: Drizzle query builders are awaitable
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
  return new UsersService(
    { db: { select: next, insert: next, update: next } } as never,
    { create: () => ({ log() {}, info() {}, error() {} }) } as never,
  )
}

describe('UsersService', () => {
  it('returns notFound when a user does not exist', async () => {
    const service = createService([[]])

    const result = await service.findOne('2ed79018-20fe-4fc2-982c-aecb12d32fb0')

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('maps a selected user to its public DTO', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const updatedAt = new Date('2026-01-02T00:00:00Z')
    const service = createService([
      [
        {
          id: '2ed79018-20fe-4fc2-982c-aecb12d32fb0',
          name: 'Ada',
          email: 'ada@example.com',
          role: 'user',
          status: 'active',
          two_factor: false,
          created_at: createdAt,
          updated_at: updatedAt,
          deleted_at: null,
        },
      ],
    ])

    const result = await service.findOne('2ed79018-20fe-4fc2-982c-aecb12d32fb0')

    assert.deepEqual(result, {
      ok: true,
      id: '2ed79018-20fe-4fc2-982c-aecb12d32fb0',
      name: 'Ada',
      email: 'ada@example.com',
      role: 'user',
      status: 'active',
      twoFactor: false,
      createdAt,
      updatedAt,
      deletedAt: undefined,
    })
  })

  it('maps a database unique constraint violation to alreadyExists', async () => {
    const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' })
    const service = createService([[], uniqueViolation])

    const result = await service.register({
      name: 'Ada Lovelace',
      registration: 12345,
      email: 'ada@example.com',
      password: 'StrongPassword123!',
    })

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })
})
