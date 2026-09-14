import assert from 'node:assert/strict'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { describe, it } from 'vitest'
import { AppModule } from '@/app.module'
import { GroupModule } from './group.module'

describe('GroupModule', () => {
  it('is registered in AppModule', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[]

    assert.ok(imports.includes(GroupModule))
  })
})
