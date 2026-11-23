import assert from 'node:assert/strict'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { describe, it } from 'vitest'
import { AppModule } from '@/app.module'
import { ActivityController } from './activity.controller'
import { ActivityModule } from './activity.module'
import { ActivityService } from './activity.service'

describe('ActivityModule', () => {
  it('registers the activity controller and service in the application', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[]
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      ActivityModule,
    ) as unknown[]
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ActivityModule) as unknown[]

    assert.ok(imports.includes(ActivityModule))
    assert.ok(controllers.includes(ActivityController))
    assert.ok(providers.includes(ActivityService))
  })
})
