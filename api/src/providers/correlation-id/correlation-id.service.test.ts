import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'vitest'
import { CorrelationIdService } from './correlation-id.service'

describe('CorrelationIdService', () => {
  let service: CorrelationIdService

  beforeEach(() => {
    service = new CorrelationIdService()
  })

  describe('generateId', () => {
    it('should generate a valid UUID v4', () => {
      const id = service.generateId()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      assert.match(id, uuidRegex)
    })

    it('should generate unique IDs', () => {
      const id1 = service.generateId()
      const id2 = service.generateId()

      assert.notStrictEqual(id1, id2)
    })
  })

  describe('run with context', () => {
    it('should maintain correlation context within run block', () => {
      const testCorrelationId = service.generateId()
      const context = {
        correlationId: testCorrelationId,
        timestamp: Date.now(),
        userId: 'test-user-123',
        role: 'user',
      }

      service.run(context, () => {
        const retrievedId = service.getCorrelationId()
        assert.strictEqual(retrievedId, testCorrelationId)

        const retrievedContext = service.getContext()
        assert.deepStrictEqual(retrievedContext, context)
      })
    })

    it('should return undefined when accessed outside run block', () => {
      const id = service.getCorrelationId()
      assert.strictEqual(id, undefined)

      const context = service.getContext()
      assert.strictEqual(context, undefined)
    })

    it('should handle nested async operations', async () => {
      const testCorrelationId = service.generateId()
      const context = {
        correlationId: testCorrelationId,
        timestamp: Date.now(),
      }

      await service.run(context, async () => {
        const id1 = service.getCorrelationId()
        assert.strictEqual(id1, testCorrelationId)

        await new Promise((resolve) => setTimeout(resolve, 10))

        const id2 = service.getCorrelationId()
        assert.strictEqual(id2, testCorrelationId)

        await Promise.all([
          new Promise((resolve) => {
            const id3 = service.getCorrelationId()
            assert.strictEqual(id3, testCorrelationId)
            resolve(true)
          }),
          new Promise((resolve) => {
            const id4 = service.getCorrelationId()
            assert.strictEqual(id4, testCorrelationId)
            resolve(true)
          }),
        ])
      })
    })
  })

  describe('updateContext', () => {
    it('should update context with additional data', () => {
      const testCorrelationId = service.generateId()
      const initialContext = {
        correlationId: testCorrelationId,
        timestamp: Date.now(),
      }

      service.run(initialContext, () => {
        let context = service.getContext()
        assert.strictEqual(context?.userId, undefined)
        assert.strictEqual(context?.role, undefined)

        service.updateContext({
          userId: 'user-123',
          role: 'user',
        })

        context = service.getContext()
        assert.strictEqual(context?.userId, 'user-123')
        assert.strictEqual(context?.role, 'user')
        assert.strictEqual(context?.correlationId, testCorrelationId)
      })
    })

    it('should do nothing if no context exists', () => {
      assert.doesNotThrow(() => {
        service.updateContext({ userId: 'user-123' })
      })
    })
  })

  describe('isolation between different contexts', () => {
    it('should maintain separate contexts for concurrent operations', async () => {
      const id1 = service.generateId()
      const id2 = service.generateId()

      const promise1 = service.run({ correlationId: id1, timestamp: Date.now() }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return service.getCorrelationId()
      })

      const promise2 = service.run({ correlationId: id2, timestamp: Date.now() }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 30))
        return service.getCorrelationId()
      })

      const [result1, result2] = await Promise.all([promise1, promise2])

      assert.strictEqual(result1, id1)
      assert.strictEqual(result2, id2)
      assert.notStrictEqual(result1, result2)
    })
  })
})
