import assert from 'node:assert'
import { describe, it } from 'vitest'
import { comparePassword, hashPassword } from './password'

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash password and return different value', async () => {
      const password = 'mySecretPassword123'
      const hashed = await hashPassword(password)

      assert.ok(hashed !== password)
      assert.strictEqual(hashed.length, 60) // bcrypt hashes are 60 chars
      assert.ok(hashed.startsWith('$2b$10$')) // bcrypt format
    })

    it('should generate different hashes for same password', async () => {
      const password = 'samePassword'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      assert.ok(hash1 !== hash2) // Different due to salt
    })

    it('should handle empty password', async () => {
      const hashed = await hashPassword('')

      assert.strictEqual(hashed.length, 60)
      assert.ok(hashed.startsWith('$2b$10$'))
    })
  })

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'correctPassword123'
      const hashed = await hashPassword(password)

      const result = await comparePassword(password, hashed)
      assert.ok(result)
    })

    it('should return false for incorrect password', async () => {
      const password = 'correctPassword123'
      const wrongPassword = 'wrongPassword123'
      const hashed = await hashPassword(password)

      const result = await comparePassword(wrongPassword, hashed)
      assert.ok(!result)
    })

    it('should handle empty password comparison', async () => {
      const emptyHash = await hashPassword('')

      const resultCorrect = await comparePassword('', emptyHash)
      const resultIncorrect = await comparePassword('notEmpty', emptyHash)

      assert.ok(resultCorrect)
      assert.ok(!resultIncorrect)
    })

    it('should be case sensitive', async () => {
      const password = 'CaseSensitive'
      const hashed = await hashPassword(password)

      const resultCorrect = await comparePassword('CaseSensitive', hashed)
      const resultIncorrect = await comparePassword('casesensitive', hashed)

      assert.ok(resultCorrect)
      assert.ok(!resultIncorrect)
    })
  })

  describe('integration', () => {
    it('should work with special characters and unicode', async () => {
      const password = 'pássword@123!#$%&*()'
      const hashed = await hashPassword(password)

      assert.ok(await comparePassword(password, hashed))
    })

    it('should work with long passwords', async () => {
      const longPassword = 'a'.repeat(1000)
      const hashed = await hashPassword(longPassword)

      assert.ok(await comparePassword(longPassword, hashed))
    })
  })
})
