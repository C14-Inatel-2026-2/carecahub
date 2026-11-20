import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { ErrKeys, type UserMetadata } from '@/types'
import { QueryResult } from '@/utils/mocks/query-result.mock'
import { ActivityService } from './activity.service'

function createService(results: unknown[]) {
  const next = () => new QueryResult(results.shift())
  const database = { db: { select: next, insert: next, update: next } }
  const loggerFactory = { create: () => ({ log() {}, info() {}, error() {} }) }
  return new ActivityService(database as never, loggerFactory as never)
}

const DAY_IN_MS = 24 * 60 * 60 * 1000
const activityId = '7f0f8a4e-6c0b-4a51-9a39-5f1f0b2b9f10'
const teacher = { userId: 'teacher-id', name: 'Teacher', role: 'teacher' } as UserMetadata
const mentor = { userId: 'mentor-id', name: 'Mentor', role: 'mentor' } as UserMetadata
const student = { userId: 'student-id', name: 'Student', role: 'student' } as UserMetadata

const futureDate = new Date(Date.now() + 7 * DAY_IN_MS)
const pastDate = new Date('2020-01-01T00:00:00.000Z')

const activityRecord = (overrides: Record<string, unknown> = {}) => ({
  id: activityId,
  title: 'Entrega 1',
  description: 'Modelagem do banco',
  dueDate: futureDate,
  allowLateSubmissions: false,
  createdById: teacher.userId,
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  updatedAt: new Date('2026-11-01T00:00:00.000Z'),
  deletedAt: null,
  ...overrides,
})

const input = {
  title: 'Entrega 1',
  description: 'Modelagem do banco',
  dueDate: futureDate.toISOString(),
}

describe('ActivityService.upsert', () => {
  it('lets a teacher publish an activity with a future due date', async () => {
    const service = createService([[activityRecord()]])

    const result = await service.upsert(input, teacher)

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.title, 'Entrega 1')
      assert.equal(result.createdById, teacher.userId)
      assert.equal(result.isClosed, false)
    }
  })

  it('rejects an activity whose due date is already in the past', async () => {
    const service = createService([])

    const result = await service.upsert({ ...input, dueDate: pastDate.toISOString() }, teacher)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.invalidPayload })
  })

  it('forbids a student from publishing activities without touching the database', async () => {
    const service = createService([])

    const result = await service.upsert(input, student)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('allows editing the description of a closed activity when the due date is kept', async () => {
    const closed = activityRecord({ dueDate: pastDate })
    const service = createService([[closed], [{ ...closed, description: 'Nova descrição' }]])

    const result = await service.upsert(
      { ...input, id: activityId, description: 'Nova descrição', dueDate: pastDate.toISOString() },
      teacher,
    )

    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.description, 'Nova descrição')
  })

  it('rejects moving the due date of an existing activity to the past', async () => {
    const service = createService([[activityRecord()]])

    const result = await service.upsert(
      { ...input, id: activityId, dueDate: pastDate.toISOString() },
      teacher,
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.invalidPayload })
  })

  it('returns notFound when updating an activity that does not exist', async () => {
    const service = createService([[]])

    const result = await service.upsert({ ...input, id: activityId }, teacher)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })
})

describe('ActivityService.findAll', () => {
  it('lists active activities with the total count', async () => {
    const service = createService([[activityRecord()], [{ count: 1 }]])

    const result = await service.findAll({ skip: 0, take: 10 })

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.totalCount, 1)
      assert.equal(result.data[0]?.id, activityId)
    }
  })
})

describe('ActivityService.remove', () => {
  it('forbids a mentor from removing an activity', async () => {
    const service = createService([])

    const result = await service.remove(activityId, mentor)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('soft deletes the activity for a teacher', async () => {
    const service = createService([[activityRecord()], []])

    const result = await service.remove(activityId, teacher)

    assert.deepEqual(result, { ok: true })
  })
})
