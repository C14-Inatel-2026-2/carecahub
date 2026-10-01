import assert from 'node:assert/strict'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { describe, it } from 'vitest'
import { AppModule } from '@/app.module'
import { ROLE_METADATA_KEY } from '@/infra/roles.guard'
import { DashboardController } from './dashboard.controller'
import { DashboardModule } from './dashboard.module'
import { DashboardService } from './dashboard.service'

describe('DashboardModule', () => {
  it('registers the resource and restricts it to staff roles', () => {
    const appImports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[]
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      DashboardModule,
    ) as unknown[]
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, DashboardModule) as unknown[]
    const roles = Reflect.getMetadata(
      ROLE_METADATA_KEY,
      DashboardController.prototype.getDashboard,
    ) as string[]

    assert.ok(appImports.includes(DashboardModule))
    assert.ok(controllers.includes(DashboardController))
    assert.ok(providers.includes(DashboardService))
    assert.deepEqual(roles, ['admin', 'teacher', 'mentor'])
  })
})
