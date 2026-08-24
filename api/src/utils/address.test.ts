import assert from 'node:assert'
import { describe, it } from 'node:test'
import { formatAddress } from './address'

describe('formatAddress', () => {
  it('should format a complete address', () => {
    const address = {
      street: 'Rua das Flores',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    }

    assert.strictEqual(formatAddress(address), 'Rua das Flores, 123, Centro - São Paulo/SP')
  })

  it('should format an address without district', () => {
    const address = {
      street: 'Av. Paulista',
      number: '1000',
      district: null,
      city: 'São Paulo',
      state: 'SP',
    }

    assert.strictEqual(formatAddress(address), 'Av. Paulista, 1000 - São Paulo/SP')
  })

  it('should return undefined if street is missing', () => {
    const address = {
      street: null,
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    }

    assert.strictEqual(formatAddress(address), undefined)
  })

  it('should return undefined if city is missing', () => {
    const address = {
      street: 'Rua das Flores',
      number: '123',
      district: 'Centro',
      city: null,
      state: 'SP',
    }

    assert.strictEqual(formatAddress(address), undefined)
  })

  it('should return undefined if state is missing', () => {
    const address = {
      street: 'Rua das Flores',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: null,
    }

    assert.strictEqual(formatAddress(address), undefined)
  })
})
