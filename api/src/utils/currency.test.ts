import assert from 'node:assert'
import { describe, it } from 'node:test'
import { centsToDouble, doubleToCents } from './currency'

describe('Currency Utils', () => {
  describe('centsToDouble', () => {
    it('should convert cents to double correctly', () => {
      assert.strictEqual(centsToDouble(1000), 10.0)
      assert.strictEqual(centsToDouble(2550), 25.5)
      assert.strictEqual(centsToDouble(1), 0.01)
      assert.strictEqual(centsToDouble(99), 0.99)
    })

    it('should handle zero and undefined values', () => {
      assert.strictEqual(centsToDouble(0), 0)
      assert.strictEqual(centsToDouble(undefined), 0)
    })

    it('should handle large values', () => {
      assert.strictEqual(centsToDouble(1000000), 10000.0)
    })
  })

  describe('doubleToCents', () => {
    it('should convert double to cents correctly', () => {
      assert.strictEqual(doubleToCents(10.0), 1000)
      assert.strictEqual(doubleToCents(25.5), 2550)
      assert.strictEqual(doubleToCents(0.01), 1)
      assert.strictEqual(doubleToCents(0.99), 99)
    })

    it('should handle zero and undefined values', () => {
      assert.strictEqual(doubleToCents(0), 0)
      assert.strictEqual(doubleToCents(undefined), 0)
    })

    it('should handle decimal precision', () => {
      assert.strictEqual(doubleToCents(19.99), 1999)
      assert.strictEqual(doubleToCents(1.23), 123)
      assert.strictEqual(doubleToCents(1.235), 124) // Note: precision may vary
    })

    it('should handle large values', () => {
      assert.strictEqual(doubleToCents(10000.0), 1000000)
    })
  })

  describe('round trip conversion', () => {
    it('should maintain precision in round trip conversions', () => {
      const originalCents = 2550
      const converted = doubleToCents(centsToDouble(originalCents))
      assert.strictEqual(converted, originalCents)
    })

    it('should maintain precision for common currency values', () => {
      const testValues = [100, 999, 1550, 9999]

      testValues.forEach((cents) => {
        const roundTrip = doubleToCents(centsToDouble(cents))
        assert.strictEqual(roundTrip, cents)
      })
    })
  })
})
