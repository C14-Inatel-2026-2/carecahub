import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ErrKeys } from '@/types'
import { UsersService } from './user.service'

const admin = { userId: 'admin-id', name: 'Admin', role: 'admin' }
const teacher = { userId: 'teacher-id', name: 'Teacher', role: 'teacher' }
const mentor = { userId: 'mentor-id', name: 'Mentor', role: 'mentor' }

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

    const result = await service.findOne('2ed79018-20fe-4fc2-982c-aecb12d32fb0', admin)

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
          registration: 12345,
          githubName: 'ada',
          classroom: 'A1',
          email: 'ada@example.com',
          role: 'student',
          status: 'active',
          two_factor: false,
          createdAt: createdAt,
          updatedAt: updatedAt,
          deletedAt: null,
        },
      ],
    ])

    const result = await service.findOne('2ed79018-20fe-4fc2-982c-aecb12d32fb0', admin)

    assert.deepEqual(result, {
      ok: true,
      id: '2ed79018-20fe-4fc2-982c-aecb12d32fb0',
      name: 'Ada',
      registration: 12345,
      githubName: 'ada',
      classroom: 'A1',
      email: 'ada@example.com',
      role: 'student',
      status: 'active',
      twoFactor: false,
      createdAt,
      updatedAt,
      deletedAt: undefined,
    })
  })

  it('maps a database unique constraint violation to alreadyExists', async () => {
    const uniqueViolation = Object.assign(new Error('duplicate key'), {
      code: '23505',
    })
    const service = createService([[], uniqueViolation])

    const result = await service.register(
      {
        name: 'Ada Lovelace',
        registration: 12345,
        email: 'ada@example.com',
        password: 'StrongPassword123!',
        role: 'student',
      },
      admin,
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })

  it('forbids a teacher from creating an admin', async () => {
    const service = createService([])

    const result = await service.register(
      {
        name: 'New Admin',
        registration: 12346,
        email: 'new-admin@example.com',
        password: 'StrongPassword123!',
        role: 'admin',
      },
      teacher,
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('allows a teacher to create a mentor', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const service = createService([
      [],
      [
        {
          id: 'mentor-user-id',
          name: 'New Mentor',
          registration: 12347,
          githubName: null,
          classroom: null,
          email: 'mentor@example.com',
          role: 'mentor',
          status: 'active',
          two_factor: false,
          createdAt,
          updatedAt: createdAt,
          deletedAt: null,
        },
      ],
    ])

    const result = await service.register(
      {
        name: 'New Mentor',
        registration: 12347,
        email: 'mentor@example.com',
        password: 'StrongPassword123!',
        role: 'mentor',
      },
      teacher,
    )

    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.role, 'mentor')
  })

  it('forbids a mentor from reading another mentor', async () => {
    const service = createService([
      [
        {
          id: 'other-mentor',
          role: 'mentor',
          deletedAt: null,
        },
      ],
    ])

    const result = await service.findOne('other-mentor', mentor)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('forbids a teacher from promoting a student to admin', async () => {
    const service = createService([
      [
        {
          id: 'student-id',
          name: 'Student',
          registration: 12348,
          githubName: null,
          classroom: 'A1',
          email: 'student@example.com',
          role: 'student',
          status: 'active',
          two_factor: false,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
          deletedAt: null,
        },
      ],
    ])

    const result = await service.update('student-id', { role: 'admin' }, teacher)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})
