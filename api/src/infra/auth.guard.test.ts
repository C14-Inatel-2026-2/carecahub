import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request, Response } from 'express'
import { AuthService } from '@/resources/auth/auth.service'
import { headersDictionary } from '@/types'
import { AuthGuard } from './auth.guard'

describe('AuthGuard', () => {
  const payload = { userId: '1', role: 'admin', email: 'test@example.com' }
  let request: Partial<Request>
  let guard: AuthGuard
  let verifyAsync: ReturnType<typeof mock.fn>
  let refresh: ReturnType<typeof mock.fn>
  let clearTokenCookies: ReturnType<typeof mock.fn>
  let setResponseWithTokens: ReturnType<typeof mock.fn>
  let getAllAndOverride: ReturnType<typeof mock.fn>

  beforeEach(() => {
    request = { cookies: {} }
    verifyAsync = mock.fn(async () => payload)
    refresh = mock.fn()
    clearTokenCookies = mock.fn()
    setResponseWithTokens = mock.fn()
    getAllAndOverride = mock.fn(() => false)
    guard = new AuthGuard(
      { verifyAsync } as unknown as JwtService,
      { refresh, clearTokenCookies, setResponseWithTokens } as unknown as AuthService,
      { getAllAndOverride } as unknown as Reflector,
    )
  })

  function context(): ExecutionContext {
    return {
      getHandler: mock.fn(),
      getClass: mock.fn(),
      switchToHttp: mock.fn(() => ({
        getRequest: mock.fn(() => request),
        getResponse: mock.fn(() => ({}) as Response),
      })),
    } as unknown as ExecutionContext
  }

  it('allows public routes without a token', async () => {
    getAllAndOverride = mock.fn(() => true)
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
    assert.strictEqual(verifyAsync.mock.calls[0].arguments[0], 'valid-token')
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
    verifyAsync = mock.fn(async () => {
      calls += 1
      if (calls === 1) throw new Error('expired')
      return payload
    })
    refresh = mock.fn(async () => refreshedTokens)
    guard = new AuthGuard(
      { verifyAsync } as unknown as JwtService,
      { refresh, clearTokenCookies, setResponseWithTokens } as unknown as AuthService,
      { getAllAndOverride } as unknown as Reflector,
    )

    assert.strictEqual(await guard.canActivate(context()), true)
    assert.deepStrictEqual(request.user, payload)
    assert.deepStrictEqual(refresh.mock.calls[0].arguments, [{ oldRefreshToken: 'refresh-token' }])
    assert.strictEqual(setResponseWithTokens.mock.callCount(), 1)
  })

  it('clears cookies when refresh fails', async () => {
    request.cookies = {
      [headersDictionary.accessToken]: 'expired-token',
      [headersDictionary.refreshToken]: 'refresh-token',
    }
    verifyAsync = mock.fn(async () => {
      throw new Error('expired')
    })
    refresh = mock.fn(async () => {
      throw new Error('invalid refresh token')
    })
    guard = new AuthGuard(
      { verifyAsync } as unknown as JwtService,
      { refresh, clearTokenCookies, setResponseWithTokens } as unknown as AuthService,
      { getAllAndOverride } as unknown as Reflector,
    )

    assert.strictEqual(await guard.canActivate(context()), false)
    assert.strictEqual(clearTokenCookies.mock.callCount(), 1)
  })
})
