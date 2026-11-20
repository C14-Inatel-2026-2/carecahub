import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { describe, it } from 'vitest'
import { GetActivityDto } from './get-activity.dto'
import { GradeSubmissionDto } from './grade-submission.dto'
import { SubmitActivityDto } from './submit-activity.dto'
import { UpsertActivityDto } from './upsert-activity.dto'

describe('UpsertActivityDto', () => {
  it('accepts a valid activity payload', async () => {
    const input = Object.assign(new UpsertActivityDto(), {
      title: 'Entrega 1',
      description: 'Modelagem do banco',
      dueDate: '2026-12-01T23:59:00.000Z',
    })

    assert.equal((await validate(input)).length, 0)
  })

  it('points to the title field when the title is missing', async () => {
    const input = Object.assign(new UpsertActivityDto(), {
      title: '',
      description: 'Modelagem do banco',
      dueDate: '2026-12-01T23:59:00.000Z',
    })

    const errors = await validate(input)

    assert.deepEqual(
      errors.map((error) => error.property),
      ['title'],
    )
  })
})

describe('GradeSubmissionDto', () => {
  it('rejects a grade above 10', async () => {
    const input = Object.assign(new GradeSubmissionDto(), { grade: 11 })

    const errors = await validate(input)

    assert.equal(errors[0]?.property, 'grade')
  })
})

describe('SubmitActivityDto', () => {
  it('rejects a value that is not a URL', async () => {
    const input = Object.assign(new SubmitActivityDto(), { url: 'meu trabalho' })

    const errors = await validate(input)

    assert.equal(errors[0]?.property, 'url')
  })
})

describe('GetActivityDto.toDto', () => {
  const record = {
    id: 'activity-id',
    title: 'Entrega 1',
    description: 'Modelagem do banco',
    dueDate: new Date('2026-12-01T23:59:00.000Z'),
    allowLateSubmissions: false,
    createdById: 'teacher-id',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    deletedAt: null,
  }

  it('marks the activity as open before the due date', () => {
    const dto = GetActivityDto.toDto(record, new Date('2026-11-30T00:00:00.000Z'))

    assert.equal(dto.isClosed, false)
    assert.equal(dto.deletedAt, undefined)
  })

  it('marks the activity as closed after the due date', () => {
    const dto = GetActivityDto.toDto(record, new Date('2026-12-02T00:00:00.000Z'))

    assert.equal(dto.isClosed, true)
  })
})
