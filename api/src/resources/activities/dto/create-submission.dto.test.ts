import assert from 'node:assert/strict'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, it } from 'vitest'
import { CreateSubmissionDto } from './create-submission.dto'

describe('CreateSubmissionDto', () => {
  it('accepts owned file and repository identifiers with additional HTTP links', async () => {
    const dto = plainToInstance(CreateSubmissionDto, {
      fileIds: ['48d513dc-5a9e-4f13-9c13-ee27589bb7eb'],
      repositoryIds: ['a761f798-c361-4a22-ab01-244dd3b4124a'],
      additionalLinks: ['https://example.com/deliverable'],
    })

    assert.deepEqual(await validate(dto), [])
  })

  it('rejects invalid links and more than the submission limits', async () => {
    const dto = plainToInstance(CreateSubmissionDto, {
      fileIds: Array.from({ length: 11 }, () => '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'),
      additionalLinks: ['ftp://example.com/file'],
    })

    const errors = await validate(dto)

    assert.ok(errors.some((error) => error.property === 'fileIds'))
    assert.ok(errors.some((error) => error.property === 'additionalLinks'))
  })
})
