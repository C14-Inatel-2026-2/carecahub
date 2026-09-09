import assert from 'node:assert/strict'
import { JwtService } from '@nestjs/jwt'
import { Response } from 'express'
import { beforeEach, describe, it, vi } from 'vitest'
import { CacheService } from '@/providers/cache/cache.service'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { MailService } from '@/providers/mail/mail.service'
import { UserMetadata } from '@/types'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  let sign: ReturnType<typeof vi.fn>
  let queryResults: unknown[]

  class QueryResult<T> implements PromiseLike<T> {
    constructor(private readonly result: T) {}
    from() {
      return this
    }
    where() {
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
      return Promise.resolve(this.result).then(onfulfilled, onrejected)
    }
  }

  const makePayload = (overrides: Partial<UserMetadata> = {}): UserMetadata => ({
    userId: 'user-1',
    role: 'user',
    name: 'Test User',
    ...overrides,
  })

  beforeEach(() => {
    queryResults = []
    const nextQuery = () => new QueryResult(queryResults.shift())
    let calls = 0
    sign = vi.fn(() => {
      calls += 1
      return calls === 1 ? 'access-token' : 'refresh-token'
    })
    service = new AuthService(
      {
        db: { select: nextQuery, update: nextQuery },
      } as unknown as DrizzleService,
      {} as CacheService,
      { sign } as unknown as JwtService,
      {} as MailService,
      {
        create: vi.fn(() => ({
          log: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        })),
      } as unknown as LoggerFactory,
    )
  })

  it('generates access and refresh tokens', async () => {
    const result = await service.prepareNewTokens('user-1', makePayload())

    assert.deepStrictEqual(result, {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })
    assert.strictEqual(sign.mock.calls.length, 2)
  })

  it('sets both authentication cookies', () => {
    const cookie = vi.fn()
    service.setResponseWithTokens({ cookie } as unknown as Response, {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })

    assert.strictEqual(cookie.mock.calls.length, 2)
    assert.strictEqual(cookie.mock.calls[0][2].domain, undefined)
  })

  it('clears both authentication cookies', () => {
    const clearCookie = vi.fn()
    service.clearTokenCookies({ clearCookie } as unknown as Response)

    assert.strictEqual(clearCookie.mock.calls.length, 2)
  })

  it('returns the authenticated user from the database', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const updatedAt = new Date('2026-01-02T00:00:00Z')
    queryResults.push([
      {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        two_factor: false,
        createdAt: createdAt,
        updatedAt: updatedAt,
        deletedAt: null,
      },
    ])

    const result = await service.me('user-1')

    assert.deepEqual(result, {
      ok: true,
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      status: 'active',
      twoFactor: false,
      createdAt,
      updatedAt,
      deletedAt: undefined,
    })
  })

  it('rejects login for an inactive user', async () => {
    queryResults.push([
      {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user',
        status: 'inactive',
        two_factor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ])

    const result = await service.login({
      username: 'test@example.com',
      password: 'secret',
    })

    assert.deepEqual(result, { ok: false, errKey: 'unauthorizedErrKey' })
  })
})
