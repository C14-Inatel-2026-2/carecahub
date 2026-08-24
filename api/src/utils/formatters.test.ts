import assert from 'node:assert'
import { describe, it } from 'node:test'
import { formatCPF, formatPhone, formatPostalCode, formatRG } from './formatters'

describe('formatters', () => {
  describe('formatPhone', () => {
    it('returns empty string for empty input', () => {
      assert.strictEqual(formatPhone(''), '')
    })

    it('formats 10-digit BR landline as (AA) 9999-9999', () => {
      assert.strictEqual(formatPhone('1132654321'), '(11) 3265-4321')
    })

    it('formats 11-digit BR mobile as (AA) 99999-9999', () => {
      assert.strictEqual(formatPhone('11987654321'), '(11) 98765-4321')
    })

    it('formats 12-digit BR number with country code +55 and removes it by default', () => {
      assert.strictEqual(formatPhone('551132654321'), '(11) 3265-4321')
    })

    it('keeps country code when removeCountryCode is false', () => {
      assert.strictEqual(
        formatPhone('5511987654321', { removeCountryCode: false }),
        '+55 (11) 98765-4321',
      )
    })

    it('formats progressively while typing local BR numbers', () => {
      assert.strictEqual(formatPhone('11'), '(11')
      assert.strictEqual(formatPhone('1132'), '(11) 32')
      assert.strictEqual(formatPhone('11326543'), '(11) 3265-43')
    })

    it('normalizes non-digit characters before BR formatting', () => {
      assert.strictEqual(formatPhone('(11) 98765-4321'), '(11) 98765-4321')
      assert.strictEqual(formatPhone('+55 (11) 3265-4321'), '(11) 3265-4321')
    })

    it('falls back to original value for unexpected lengths', () => {
      assert.strictEqual(formatPhone('+1 (212) 555-0123'), '+1 (212) 555-0123')
      assert.strictEqual(formatPhone('123456789012345'), '123456789012345')
    })
  })

  describe('formatPostalCode', () => {
    it('keeps only digits and applies CEP mask', () => {
      assert.strictEqual(formatPostalCode('12.345-678'), '12345-678')
      assert.strictEqual(formatPostalCode('1234'), '1234')
    })
  })

  describe('formatCPF', () => {
    it('formats partial and full CPF values', () => {
      assert.strictEqual(formatCPF('123456'), '123.456')
      assert.strictEqual(formatCPF('12345678901'), '123.456.789-01')
    })
  })

  describe('formatRG', () => {
    it('formats RG preserving alphanumeric verifier digit', () => {
      assert.strictEqual(formatRG('12.345.678-X'), '12.345.678-X')
      assert.strictEqual(formatRG('12345678x'), '12.345.678-x')
    })
  })
})
