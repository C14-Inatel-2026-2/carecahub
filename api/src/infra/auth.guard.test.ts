import assert from 'node:assert/strict'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request, Response } from 'express'
import { beforeEach, describe, it, vi } from 'vitest'
import { AuthService } from '@/resources/auth/auth.service'
import { headersDictionary } from '@/types'
import { AuthGuard } from './auth.guard'

describe('AuthGuard', () => {
  const payload = { userId: '1', role: 'admin', email: 'test@example.com' }
  let request: Partial<Request>
  let guard: AuthGuard
  let verifyAsync: ReturnType<typeof vi.fn>
  let refresh: ReturnType<typeof vi.fn>
  let clearTokenCookies: ReturnType<typeof vi.fn>
  let setResponseWithTokens: ReturnType<typeof vi.fn>
  let getAllAndOverride: ReturnType<typeof vi.fn>

  beforeEach(() => {
    request = { cookies: {} }
    verifyAsync = vi.fn(async () => payload)
    refresh = vi.fn()
    clearTokenCookies = vi.fn()
    setResponseWithTokens = vi.fn()
    getAllAndOverride = vi.fn(() => false)
    guard = new AuthGuard(
      { verifyAsync } as unknown as JwtService,
      { refresh, clearTokenCookies, setResponseWithTokens } as unknown as AuthService,
      { getAllAndOverride } as unknown as Reflector,
    )
  })

  function context(): ExecutionContext {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn(() => ({
        getRequest: vi.fn(() => request),
        getResponse: vi.fn(() => ({}) as Response),
      })),
    } as unknown as ExecutionContext
  }

  it('allows public routes without a token', async () => {
    getAllAndOverride = vi.fn(() => true)
    guard = new AuthGuard(
      { verifyAsync } as unknown as JwtService,
      { refresh, clearTokenCookies, setResponseWithTokens } as unknown as AuthService,
      { getAllAndOverride } as unknown as Reflector,
    )

    assert.strictEqual(await guard.canActivate(context()), true)
  })

  it('allows a valid access token and attaches its payload', async () => {
    request.cookies = { [headersDictionary.accessToken]: 'valid-token' }

    assert.strictEqual(await guard.canActivate(context()), true)
    assert.deepStrictEqual(request.user, payload)
    assert.strictEqual(verifyAsync.mock.calls[0][0], 'valid-token')
  })

  it('denies protected routes without a token', async () => {
    assert.strictEqual(await guard.canActivate(context()), false)
  })

  it('refreshes an expired access token', async () => {
    const refreshedTokens = { accessToken: 'new-token', refreshToken: 'new-refresh-token' }
    request.cookies = {
      [headersDictionary.accessToken]: 'expired-token',
      [headersDictionary.refreshToken]: 'refresh-token',
    }
    let calls = 0
    verifyAsync = vi.fn(async () => {
      calls += 1
      if (calls === 1) throw new Error('expired')
      return payload
    })
    refresh = vi.fn(async () => refreshedTokens)
    guard = new AuthGuard(
      { verifyAsync } as unknown as JwtService,
      { refresh, clearTokenCookies, setResponseWithTokens } as unknown as AuthService,
      { getAllAndOverride } as unknown as Reflector,
    )

    assert.strictEqual(await guard.canActivate(context()), true)
    assert.deepStrictEqual(request.user, payload)
    assert.deepStrictEqual(refresh.mock.calls[0], [{ oldRefreshToken: 'refresh-token' }])
    assert.strictEqual(setResponseWithTokens.mock.calls.length, 1)
  })

  it('clears cookies when refresh fails', async () => {
    request.cookies = {
      [headersDictionary.accessToken]: 'expired-token',
      [headersDictionary.refreshToken]: 'refresh-token',
    }
    verifyAsync = vi.fn(async () => {
      throw new Error('expired')
    })
    refresh = vi.fn(async () => {
      throw new Error('invalid refresh token')
    })
    guard = new AuthGuard(
      { verifyAsync } as unknown as JwtService,
      { refresh, clearTokenCookies, setResponseWithTokens } as unknown as AuthService,
      { getAllAndOverride } as unknown as Reflector,
    )

    assert.strictEqual(await guard.canActivate(context()), false)
    assert.strictEqual(clearTokenCookies.mock.calls.length, 1)
  })
})
