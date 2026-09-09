import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { AppController } from './app.controller'

describe('AppController', () => {
  it('returns the health-check response', () => {
    const controller = new AppController()

    assert.strictEqual(controller.getHealth(), 'OK')
  })
})
