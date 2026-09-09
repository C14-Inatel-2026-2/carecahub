import assert from 'node:assert'
import { describe, it } from 'vitest'
import { removeDeepData } from './removeDeepData'

describe('removeDeepData', () => {
  it('should remove specified fields from simple object', () => {
    const data = {
      name: 'John',
      password: 'secret',
      email: 'john@example.com',
    }

    const result = removeDeepData(data, ['password'])

    assert.deepEqual(result, {
      name: 'John',
      email: 'john@example.com',
    })
  })

  it('should remove multiple fields', () => {
    const data = {
      id: 1,
      name: 'John',
      password: 'secret',
      token: 'abc123',
      email: 'john@example.com',
    }

    const result = removeDeepData(data, ['password', 'token'])

    assert.deepEqual(result, {
      id: 1,
      name: 'John',
      email: 'john@example.com',
    })
  })

  it('should handle nested objects', () => {
    const data = {
      user: {
        name: 'John',
        password: 'secret',
        profile: {
          age: 30,
          secret: 'hidden',
        },
      },
      settings: {
        theme: 'dark',
        apiKey: 'sensitive',
      },
    }

    const result = removeDeepData(data, ['password', 'secret', 'apiKey'])

    assert.deepEqual(result, {
      user: {
        name: 'John',
        profile: {
          age: 30,
        },
      },
      settings: {
        theme: 'dark',
      },
    })
  })

  it('should handle arrays of objects', () => {
    const data = {
      users: [
        { name: 'John', password: 'secret1' },
        { name: 'Jane', password: 'secret2' },
      ],
    }

    const result = removeDeepData(data, ['password'])

    assert.deepEqual(result, {
      users: [{ name: 'John' }, { name: 'Jane' }],
    })
  })

  it('should handle arrays at root level', () => {
    const data = [
      { name: 'John', password: 'secret1' },
      { name: 'Jane', password: 'secret2' },
    ]

    const result = removeDeepData(data, ['password'])

    assert.deepEqual(result, [{ name: 'John' }, { name: 'Jane' }])
  })

  it('should preserve non-object values', () => {
    const data = {
      name: 'John',
      age: 30,
      active: true,
      score: null,
      tags: ['admin', 'user'],
      password: 'secret',
    }

    const result = removeDeepData(data, ['password'])

    assert.deepEqual(result, {
      name: 'John',
      age: 30,
      active: true,
      score: null,
      tags: ['admin', 'user'],
    })
  })

  it('should handle Date objects without modification', () => {
    const date = new Date('2024-01-01')
    const data = {
      createdAt: date,
      password: 'secret',
    }

    // biome-ignore lint/suspicious/noExplicitAny: Testing return type structure
    const result = removeDeepData(data, ['password']) as any

    assert.equal(result.createdAt, date) // Same instance
    assert.equal(result.createdAt instanceof Date, true)
    assert.equal(result.password, undefined)
  })

  it('should return primitive values unchanged', () => {
    assert.equal(removeDeepData('string', ['field']), 'string')
    assert.equal(removeDeepData(123, ['field']), 123)
    assert.equal(removeDeepData(true, ['field']), true)
    assert.equal(removeDeepData(null, ['field']), null)
    assert.equal(removeDeepData(undefined, ['field']), undefined)
  })

  it('should handle empty objects and arrays', () => {
    assert.deepEqual(removeDeepData({}, ['field']), {})
    assert.deepEqual(removeDeepData([], ['field']), [])
  })

  it('should handle complex nested structure', () => {
    const data = {
      user: {
        profile: {
          personal: {
            name: 'John',
            ssn: 'sensitive',
          },
          settings: [
            { key: 'theme', value: 'dark' },
            { key: 'apiKey', value: 'secret', meta: { password: 'hidden' } },
          ],
        },
      },
    }

    const result = removeDeepData(data, ['ssn', 'password'])

    assert.deepEqual(result, {
      user: {
        profile: {
          personal: {
            name: 'John',
          },
          settings: [
            { key: 'theme', value: 'dark' },
            { key: 'apiKey', value: 'secret', meta: {} },
          ],
        },
      },
    })
  })

  it('should handle fields that do not exist', () => {
    const data = { name: 'John', age: 30 }
    const result = removeDeepData(data, ['nonexistent', 'password'])

    assert.deepEqual(result, { name: 'John', age: 30 })
  })

  it('should preserve falsy values while removing only specified fields', () => {
    const data = {
      enabled: false,
      count: 0,
      note: '',
      password: 'secret',
    }

    const result = removeDeepData(data, ['password'])

    assert.deepEqual(result, {
      enabled: false,
      count: 0,
      note: '',
    })
  })
})
