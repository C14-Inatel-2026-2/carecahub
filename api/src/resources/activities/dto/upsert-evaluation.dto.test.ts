import assert from 'node:assert/strict'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, it } from 'vitest'
import { UpsertEvaluationDto } from './upsert-evaluation.dto'

describe('UpsertEvaluationDto', () => {
  it('accepts scores from zero through one hundred', async () => {
    assert.deepEqual(await validate(plainToInstance(UpsertEvaluationDto, { score: 0 })), [])
    assert.deepEqual(await validate(plainToInstance(UpsertEvaluationDto, { score: 100 })), [])
  })

  it('rejects scores outside the activity range', async () => {
    const errors = await validate(plainToInstance(UpsertEvaluationDto, { score: 101 }))
    assert.ok(errors.some((error) => error.property === 'score'))
  })
})
