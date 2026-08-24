import assert from 'node:assert'
import { describe, it } from 'node:test'
import { endOfDay, startOfDay } from './date'
import { buildDateFieldQuery, buildStringFieldQuery } from './prisma'

describe('Prisma Utils', () => {
  describe('buildStringFieldQuery', () => {
    it('should return contains query for non-empty string', () => {
      const result = buildStringFieldQuery('test search')

      assert.deepEqual(result, {
        contains: 'test search',
        mode: 'insensitive',
      })
    })

    it('should return undefined for empty string', () => {
      const result = buildStringFieldQuery('')
      assert.strictEqual(result, undefined)
    })

    it('should return undefined for undefined input', () => {
      const result = buildStringFieldQuery(undefined)
      assert.strictEqual(result, undefined)
    })

    it('should handle whitespace-only string', () => {
      const result = buildStringFieldQuery('   ')

      assert.deepEqual(result, {
        contains: '   ',
        mode: 'insensitive',
      })
    })

    it('should handle special characters', () => {
      const searchTerm = 'test@email.com'
      const result = buildStringFieldQuery(searchTerm)

      assert.deepEqual(result, {
        contains: searchTerm,
        mode: 'insensitive',
      })
    })
  })

  describe('buildDateFieldQuery', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-12-31')

    it('should return date range query with both dates', () => {
      const result = buildDateFieldQuery({ startDate, endDate })

      assert.deepEqual(result, {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      })
    })

    it('should return query with only start date', () => {
      const result = buildDateFieldQuery({ startDate })

      assert.deepEqual(result, {
        gte: startOfDay(startDate),
        lte: undefined,
      })
    })

    it('should return query with only end date', () => {
      const result = buildDateFieldQuery({ endDate })

      assert.deepEqual(result, {
        gte: undefined,
        lte: endOfDay(endDate),
      })
    })

    it('should return undefined when no dates provided', () => {
      const result = buildDateFieldQuery({})
      assert.strictEqual(result, undefined)
    })

    it('should return undefined when both dates are undefined', () => {
      const result = buildDateFieldQuery({
        startDate: undefined,
        endDate: undefined,
      })
      assert.strictEqual(result, undefined)
    })

    it('should handle same start and end date', () => {
      const sameDate = new Date('2024-06-15')
      const result = buildDateFieldQuery({
        startDate: sameDate,
        endDate: sameDate,
      })

      assert.deepEqual(result, {
        gte: startOfDay(sameDate),
        lte: endOfDay(sameDate),
      })
    })
  })
})
