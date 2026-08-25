import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { Request } from 'express'
import { env } from '@/providers/config/env'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { executionContextMock } from '@/utils/mocks/execution-context.mock'
import { ApiSecretGuard } from './api-key.guard'

describe('ApiSecretGuard', () => {
  let guard: ApiSecretGuard
  const allowedToken = env.API_SECRET

  beforeEach(async () => {
    guard = new ApiSecretGuard({
      create: mock.fn(() => ({ debug: mock.fn() })),
    } as unknown as LoggerFactory)
  })

  it('define guard instance', () => {
    assert.ok(guard)
  })

  it('authorize with success in private route', async () => {
    const extractSecretFromHeader = mock.fn(() => allowedToken)
    guard.extractSecretFromHeader = extractSecretFromHeader

    const canActivate = guard.canActivate(executionContextMock)
    assert.strictEqual(canActivate, true)

    assert.ok(
      (
        executionContextMock.switchToHttp() as unknown as {
          getRequest: ReturnType<typeof mock.fn>
        }
      ).getRequest.mock.callCount() > 0,
    )
  })

  it('throw if token not found in header', async () => {
    const extractSecretFromHeader = mock.fn(() => undefined)
    guard.extractSecretFromHeader = extractSecretFromHeader

    assert.strictEqual(guard.canActivate(executionContextMock), false)
    assert.strictEqual(extractSecretFromHeader.mock.callCount(), 1)
  })

  it('throw if token is wrong', async () => {
    const extractSecretFromHeader = mock.fn(() => 'wrong')
    guard.extractSecretFromHeader = extractSecretFromHeader

    assert.strictEqual(guard.canActivate(executionContextMock), false)
    assert.strictEqual(extractSecretFromHeader.mock.callCount(), 1)
  })

  describe('extractTokenFromHeader', () => {
    it('should return the token if authorization header is valid', () => {
      const request = { headers: { authorization: 'Bearer valid-token' } } as Request
      const token = guard.extractSecretFromHeader(request)
      assert.strictEqual(token, 'valid-token')
    })

    it('should return undefined if authorization header is missing', () => {
      const request = { headers: {} } as Request
      const token = guard.extractSecretFromHeader(request)
      assert.strictEqual(token, undefined)
    })

    it('should return undefined if authorization header is not Bearer type', () => {
      const request = { headers: { authorization: 'Untyped some-token' } } as Request
      const token = guard.extractSecretFromHeader(request)
      assert.strictEqual(token, undefined)
    })

    it('should return undefined if authorization header is malformed', () => {
      const request = { headers: { authorization: 'Bearer' } } as Request
      const token = guard.extractSecretFromHeader(request)
      assert.strictEqual(token, undefined)
    })
  })
})
