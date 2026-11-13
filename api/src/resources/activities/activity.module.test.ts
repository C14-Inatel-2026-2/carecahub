import assert from 'node:assert/strict'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { describe, it } from 'vitest'
import { AppModule } from '@/app.module'
import { ActivityModule } from './activity.module'

describe('ActivityModule', () => {
  it('is registered in AppModule', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[]

    assert.ok(imports.includes(ActivityModule))
  })
})
