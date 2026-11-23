import assert from 'node:assert/strict'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, it } from 'vitest'
import { CreateActivityDto } from './create-activity.dto'

const validInput = {
  title: 'Entrega da primeira atividade',
  description: 'Envie os arquivos e links solicitados.',
  dueAt: '2026-11-20T23:59:00.000-03:00',
  allowLateSubmissions: false,
  submissionType: 'both',
  attachmentIds: ['48d513dc-5a9e-4f13-9c13-ee27589bb7eb'],
}

describe('CreateActivityDto', () => {
  it('rejects titles shorter than three characters and more than ten attachments', async () => {
    const dto = plainToInstance(CreateActivityDto, {
      ...validInput,
      title: 'ab',
      attachmentIds: Array.from({ length: 11 }, () => validInput.attachmentIds[0]),
    })

    const errors = await validate(dto)

    assert.ok(errors.some((error) => error.property === 'title'))
    assert.ok(errors.some((error) => error.property === 'attachmentIds'))
  })

  it('accepts a future ISO deadline and each configured submission type', async () => {
    for (const submissionType of ['links', 'files', 'both']) {
      const errors = await validate(
        plainToInstance(CreateActivityDto, { ...validInput, submissionType }),
      )

      assert.deepEqual(errors, [])
    }
  })
})
