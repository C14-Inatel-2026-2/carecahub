import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validate } from 'class-validator'
import { UpsertRepositoryDto } from './upsert-repository.dto'

describe('UpsertRepositoryDto', () => {
  it('accepts a creation payload without an ID', async () => {
    const input = Object.assign(new UpsertRepositoryDto(), {
      url: 'https://github.com/acme/api',
      ownerId: '2ed79018-20fe-4fc2-982c-aecb12d32fb0',
      projectId: 'a761f798-c361-4a22-ab01-244dd3b4124a',
    })

    const errors = await validate(input)

    assert.equal(errors.length, 0)
  })
})
