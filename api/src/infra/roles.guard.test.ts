import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RolesGuard } from './roles.guard'

describe('RolesGuard', () => {
  let guard: RolesGuard

  beforeEach(async () => {
    guard = new RolesGuard({ getAllAndOverride: mock.fn(() => []) } as unknown as Reflector)
  })

  it('define guard instance', () => {
    assert.ok(guard)
  })

  function contextFor(user: object): {
    context: ExecutionContext
    getRequest: ReturnType<typeof mock.fn>
  } {
    const getRequest = mock.fn(() => ({ user }))
    return {
      context: {
        getHandler: mock.fn(),
        switchToHttp: mock.fn(() => ({ getRequest })),
      } as unknown as ExecutionContext,
      getRequest,
    }
  }

  it('authorize with success in private route', async () => {
    const { context, getRequest } = contextFor({ role: 'ADMIN' })
    guard = new RolesGuard({
      getAllAndOverride: mock.fn(() => ['ADMIN', 'MEMBER']),
    } as unknown as Reflector)

    const canActivate = await guard.canActivate(context)
    assert.strictEqual(canActivate, true)
    assert.strictEqual(getRequest.mock.callCount(), 1)
  })

  it('not authorize if user role is not defined', async () => {
    const { context, getRequest } = contextFor({})

    const canActivate = await guard.canActivate(context)
    assert.strictEqual(canActivate, false)
    assert.strictEqual(getRequest.mock.callCount(), 1)
  })

  it('not authorize if user role is not allowed', async () => {
    const { context, getRequest } = contextFor({ role: 'MEMBER' })
    guard = new RolesGuard({ getAllAndOverride: mock.fn(() => ['ADMIN']) } as unknown as Reflector)

    const canActivate = await guard.canActivate(context)
    assert.strictEqual(canActivate, false)
    assert.strictEqual(getRequest.mock.callCount(), 1)
  })
})
