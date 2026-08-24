import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { subHours } from './date'

describe('subHours', () => {
  it('returns a new date shifted backwards by the requested number of hours', () => {
    const date = new Date('2026-08-14T15:30:00.000Z')

    const result = subHours(date, 2)

    assert.strictEqual(result.toISOString(), '2026-08-14T13:30:00.000Z')
    assert.strictEqual(date.toISOString(), '2026-08-14T15:30:00.000Z')
  })
})
