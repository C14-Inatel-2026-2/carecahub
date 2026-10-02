import assert from 'node:assert/strict'
import { beforeEach, describe, it, vi } from 'vitest'
import { UsersController } from './user.controller'
import { UsersService } from './user.service'

describe('UsersController', () => {
  const admin = { userId: 'admin-id', name: 'Admin', role: 'admin' }

  let controller: UsersController
  let getAnalytics: ReturnType<typeof vi.fn>

  beforeEach(() => {
    getAnalytics = vi.fn(async () => ({
      ok: true,
      totalUsers: 0,
      admin: 0,
      teacher: 0,
      mentor: 0,
      student: 0,
    }))
    controller = new UsersController({ getAnalytics } as unknown as UsersService)
  })

  it('delegates getAnalytics to the service with the requester', async () => {
    await controller.getAnalytics(admin)

    assert.deepStrictEqual(getAnalytics.mock.calls[0], [admin])
  })

  it('declares the analytics route before the dynamic :id route', () => {
    const methodNames = Object.getOwnPropertyNames(UsersController.prototype).filter(
      (name) => name !== 'constructor',
    )

    const analyticsIndex = methodNames.indexOf('getAnalytics')
    const findOneIndex = methodNames.indexOf('findOne')

    assert.ok(analyticsIndex !== -1, 'getAnalytics should be defined on the controller')
    assert.ok(findOneIndex !== -1, 'findOne should be defined on the controller')
    assert.ok(
      analyticsIndex < findOneIndex,
      'GET /users/analytics must be registered before GET /users/:id so it is not matched as a UUID param',
    )
  })
})
