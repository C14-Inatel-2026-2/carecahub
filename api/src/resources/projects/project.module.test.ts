import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { AppModule } from '@/app.module'
import { ProjectModule } from './project.module'

describe('ProjectModule', () => {
  it('is registered in AppModule', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[]

    assert.ok(imports.includes(ProjectModule))
  })
})
