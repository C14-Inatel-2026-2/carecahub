import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { JwtService } from '@nestjs/jwt'
import { Response } from 'express'
import { CacheService } from '@/providers/cache/cache.service'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { MailService } from '@/providers/mail/mail.service'
import { UserMetadata } from '@/types'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  let sign: ReturnType<typeof mock.fn>

  const makePayload = (overrides: Partial<UserMetadata> = {}): UserMetadata => ({
    userId: 'user-1',
    role: 'user',
    name: 'Test User',
    ...overrides,
  })

  beforeEach(() => {
    let calls = 0
    sign = mock.fn(() => {
      calls += 1
      return calls === 1 ? 'access-token' : 'refresh-token'
    })
    service = new AuthService(
      {} as DrizzleService,
      {} as CacheService,
      { sign } as unknown as JwtService,
      {} as MailService,
      {
        create: mock.fn(() => ({ log: mock.fn(), warn: mock.fn(), error: mock.fn() })),
      } as unknown as LoggerFactory,
    )
  })

  it('generates access and refresh tokens', async () => {
    const result = await service.prepareNewTokens('user-1', makePayload())

    assert.deepStrictEqual(result, { accessToken: 'access-token', refreshToken: 'refresh-token' })
    assert.strictEqual(sign.mock.callCount(), 2)
  })

  it('sets both authentication cookies', () => {
    const cookie = mock.fn()
    service.setResponseWithTokens({ cookie } as unknown as Response, {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })

    assert.strictEqual(cookie.mock.callCount(), 2)
    assert.strictEqual(cookie.mock.calls[0].arguments[2].domain, undefined)
  })

  it('clears both authentication cookies', () => {
    const clearCookie = mock.fn()
    service.clearTokenCookies({ clearCookie } as unknown as Response)

    assert.strictEqual(clearCookie.mock.callCount(), 2)
  })
})
