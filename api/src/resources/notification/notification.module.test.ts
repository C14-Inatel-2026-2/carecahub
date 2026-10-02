import assert from 'node:assert/strict'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { describe, it } from 'vitest'
import { AppModule } from '@/app.module'
import { NotificationController } from './notification.controller'
import { NotificationModule } from './notification.module'
import { NotificationService } from './notification.service'

describe('NotificationModule', () => {
  it('registers the notification controller and service in the application', () => {
    const appImports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[]
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      NotificationModule,
    ) as unknown[]
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      NotificationModule,
    ) as unknown[]

    assert.ok(appImports.includes(NotificationModule))
    assert.ok(controllers.includes(NotificationController))
    assert.ok(providers.includes(NotificationService))
  })
})
