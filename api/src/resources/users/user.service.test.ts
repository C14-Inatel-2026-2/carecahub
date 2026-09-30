import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import type { GitHubUserDetails } from '@/providers/github/github.types'
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

function createService(
  results: unknown[],
  getUserDetails: (username: string) => Promise<GitHubUserDetails | null> = async () => null,
) {
  const next = () => new QueryResult(results.shift())
  return new UsersService(
    { db: { select: next, insert: next, update: next } } as never,
    { create: () => ({ log() {}, info() {}, error() {} }) } as never,
    { getUserDetails } as never,
  )
}

describe('UsersService', () => {
  it.each(['student', 'mentor', 'teacher', 'admin'])(
    'allows %s to read their own profile',
    async (role) => {
      const user = {
        id: 'own-id',
        name: 'Own User',
        email: 'own@example.com',
        role,
        registration: null,
        githubName: 'own-gh',
        classroom: null,
        status: 'active',
        two_factor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }
      const gitHubDetails = {
        login: 'own-gh',
        avatarUrl: 'https://example.com/avatar',
        profileUrl: 'https://github.com/own-gh',
        bio: 'Bio',
        createdAt: '2020-09-01T00:00:00Z',
        publicRepos: 2,
      }
      const service = createService([[user]], async () => gitHubDetails)
      const result = await service.findOne(user.id, { userId: user.id, name: user.name, role })
      assert.equal(result.ok, true)
      if (result.ok) {
        assert.equal(result.id, user.id)
        assert.deepEqual(result.gitHubDetails, gitHubDetails)
      }
    },
  )

  it('forbids a student from reading another student', async () => {
    const service = createService([[{ id: 'other-id', role: 'student' }]])
    const result = await service.findOne('other-id', {
      userId: 'own-id',
      name: 'Student',
      role: 'student',
    })
    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('returns notFound when a user does not exist', async () => {
    const service = createService([[]])

    const result = await service.findOne('2ed79018-20fe-4fc2-982c-aecb12d32fb0', admin)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('maps a selected user to its public DTO', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const updatedAt = new Date('2026-01-02T00:00:00Z')
    const gitHubDetails = {
      login: 'ada',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1',
      profileUrl: 'https://github.com/ada',
      bio: 'Programmer',
      createdAt: '2020-09-01T00:00:00Z',
      publicRepos: 2,
    }
    const service = createService(
      [
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
      ],
      async () => gitHubDetails,
    )

    const result = await service.findOne('2ed79018-20fe-4fc2-982c-aecb12d32fb0', admin)

    assert.deepEqual(result, {
      ok: true,
      id: '2ed79018-20fe-4fc2-982c-aecb12d32fb0',
      groupId: null,
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
      gitHubDetails,
    })
  })

  it('requests GitHub details for an admin that declared an account', async () => {
    let calls = 0
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const service = createService(
      [
        [
          {
            id: 'admin-user-id',
            name: 'Admin',
            registration: null,
            githubName: 'admin-gh',
            classroom: null,
            email: 'admin@example.com',
            role: 'admin',
            status: 'active',
            two_factor: false,
            createdAt,
            updatedAt: createdAt,
            deletedAt: null,
          },
        ],
      ],
      async () => {
        calls += 1
        return null
      },
    )

    const result = await service.findOne('admin-user-id', admin)

    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.gitHubDetails, null)
    assert.equal(calls, 1)
  })

  it('enriches every user in a list that declared a GitHub account', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const row = (role: 'student' | 'mentor' | 'teacher' | 'admin', githubName: string) => ({
      id: `${role}-id`,
      name: role,
      registration: role === 'student' || role === 'mentor' ? 123 : null,
      githubName,
      classroom: role === 'student' ? 'A' : null,
      email: `${role}@example.com`,
      role,
      status: 'active',
      two_factor: false,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    })
    const usernames: string[] = []
    const service = createService(
      [
        [
          row('student', 'student-gh'),
          row('mentor', 'mentor-gh'),
          row('teacher', 'teacher-gh'),
          row('admin', 'admin-gh'),
        ],
        [{ count: 4 }],
      ],
      async (username: string) => {
        usernames.push(username)
        return {
          login: username,
          avatarUrl: `https://avatars.githubusercontent.com/${username}`,
          profileUrl: `https://github.com/${username}`,
          bio: null,
          createdAt: '2020-09-01T00:00:00Z',
          publicRepos: 2,
        }
      },
    )

    const result = await service.findAll({ skip: 0, take: 20 }, admin)

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.totalCount, 4)
      assert.deepEqual(
        result.data.map((user) => user.gitHubDetails?.login ?? null),
        ['student-gh', 'mentor-gh', 'teacher-gh', 'admin-gh'],
      )
    }
    assert.deepEqual(usernames.sort(), ['admin-gh', 'mentor-gh', 'student-gh', 'teacher-gh'])
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

  it('forbids a teacher from creating a mentor', async () => {
    const service = createService([])

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

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
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

  it('blocks deletion of a current group leader', async () => {
    const service = createService([[{ id: 'leader-id', role: 'student' }], [{ id: 'group-id' }]])

    const result = await service.remove('leader-id', admin)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.resourceInUse })
  })
})
