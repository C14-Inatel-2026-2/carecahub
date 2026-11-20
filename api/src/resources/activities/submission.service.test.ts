import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { ErrKeys, type UserMetadata } from '@/types'
import { QueryResult } from '@/utils/mocks/query-result.mock'
import { SubmissionService } from './submission.service'

/**
 * Spy on top of the shared stub: also records the payloads passed to
 * `values()` and `set()`, so tests can check what the service wrote.
 */
class RecordingQueryResult<T> extends QueryResult<T> {
  constructor(
    result: T,
    private readonly writes: Record<string, unknown>[],
  ) {
    super(result)
  }
  values(payload?: Record<string, unknown>) {
    if (payload) this.writes.push(payload)
    return this
  }
  set(payload?: Record<string, unknown>) {
    if (payload) this.writes.push(payload)
    return this
  }
}

function createService(results: unknown[]) {
  const writes: Record<string, unknown>[] = []
  const next = () => new RecordingQueryResult(results.shift(), writes)
  const database = { db: { select: next, insert: next, update: next } }
  const loggerFactory = { create: () => ({ log() {}, info() {}, error() {} }) }
  const service = new SubmissionService(database as never, loggerFactory as never)
  return { service, writes }
}

const DAY_IN_MS = 24 * 60 * 60 * 1000
const activityId = '7f0f8a4e-6c0b-4a51-9a39-5f1f0b2b9f10'
const submissionId = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f'
const groupId = 'a761f798-c361-4a22-ab01-244dd3b4124a'
const student = { userId: 'student-id', name: 'Student', role: 'student' } as UserMetadata
const teacher = { userId: 'teacher-id', name: 'Teacher', role: 'teacher' } as UserMetadata

const openActivity = {
  id: activityId,
  dueDate: new Date(Date.now() + 7 * DAY_IN_MS),
  allowLateSubmissions: false,
}
const closedActivity = { ...openActivity, dueDate: new Date('2020-01-01T00:00:00.000Z') }

const submissionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: submissionId,
  activityId,
  groupId,
  submittedById: student.userId,
  url: 'https://github.com/acme/carecahub',
  isLate: false,
  submittedAt: new Date('2026-11-13T12:00:00.000Z'),
  grade: null,
  feedback: null,
  gradedById: null,
  gradedAt: null,
  createdAt: new Date('2026-11-13T12:00:00.000Z'),
  updatedAt: new Date('2026-11-13T12:00:00.000Z'),
  ...overrides,
})

const input = { url: 'https://github.com/acme/carecahub' }

describe('SubmissionService.submit', () => {
  it('links an on-time submission to the activity, the group and the author', async () => {
    const { service, writes } = createService([
      [openActivity],
      [{ groupId }],
      [],
      [submissionRecord()],
    ])

    const result = await service.submit(activityId, input, student)

    assert.equal(result.ok, true)
    assert.equal(writes[0]?.activityId, activityId)
    assert.equal(writes[0]?.groupId, groupId)
    assert.equal(writes[0]?.submittedById, student.userId)
    assert.equal(writes[0]?.isLate, false)
    assert.ok(writes[0]?.submittedAt instanceof Date)
  })

  it('blocks a submission after the deadline when late submissions are disabled', async () => {
    const { service, writes } = createService([[closedActivity], [{ groupId }]])

    const result = await service.submit(activityId, input, student)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.deadlineExpired })
    assert.equal(writes.length, 0)
  })

  it('accepts a late submission and marks it as late when the teacher allows it', async () => {
    const { service, writes } = createService([
      [{ ...closedActivity, allowLateSubmissions: true }],
      [{ groupId }],
      [],
      [submissionRecord({ isLate: true })],
    ])

    const result = await service.submit(activityId, input, student)

    assert.equal(result.ok, true)
    assert.equal(writes[0]?.isLate, true)
  })

  it('replaces the group submission while it has not been graded', async () => {
    const newUrl = 'https://github.com/acme/carecahub-v2'
    const { service, writes } = createService([
      [openActivity],
      [{ groupId }],
      [{ id: submissionId, gradedAt: null }],
      [submissionRecord({ url: newUrl })],
    ])

    const result = await service.submit(activityId, { url: newUrl }, student)

    assert.equal(result.ok, true)
    assert.equal(writes[0]?.url, newUrl)
  })

  it('blocks a new submission after the teacher graded the previous one', async () => {
    const { service } = createService([
      [openActivity],
      [{ groupId }],
      [{ id: submissionId, gradedAt: new Date() }],
    ])

    const result = await service.submit(activityId, input, student)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.resourceInUse })
  })

  it('forbids a student who is not in a group', async () => {
    const { service } = createService([[openActivity], [{ groupId: null }]])

    const result = await service.submit(activityId, input, student)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('forbids a teacher from submitting on behalf of a group', async () => {
    const { service } = createService([])

    const result = await service.submit(activityId, input, teacher)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('returns notFound for an activity that does not exist or was removed', async () => {
    const { service } = createService([[]])

    const result = await service.submit(activityId, input, student)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it('maps a concurrent submission from the same group to alreadyExists', async () => {
    const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' })
    const { service } = createService([[openActivity], [{ groupId }], [], uniqueViolation])

    const result = await service.submit(activityId, input, student)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.alreadyExists })
  })
})

describe('SubmissionService.findByActivity', () => {
  it('returns an empty list to a student without a group', async () => {
    const { service } = createService([[openActivity], [{ groupId: null }]])

    const result = await service.findByActivity(activityId, student)

    assert.deepEqual(result, { ok: true, totalCount: 0, data: [] })
  })

  it('lists every submission to the teacher', async () => {
    const { service } = createService([
      [openActivity],
      [submissionRecord(), submissionRecord({ id: 'other', groupId: 'other-group' })],
    ])

    const result = await service.findByActivity(activityId, teacher)

    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.totalCount, 2)
  })
})

describe('SubmissionService.grade', () => {
  it('records the grade, the feedback and who graded', async () => {
    const { service, writes } = createService([
      [{ id: submissionId }],
      [submissionRecord({ grade: 8.5, feedback: 'Boa modelagem', gradedById: teacher.userId })],
    ])

    const result = await service.grade(
      submissionId,
      { grade: 8.5, feedback: '  Boa modelagem  ' },
      teacher,
    )

    assert.equal(result.ok, true)
    assert.equal(writes[0]?.grade, 8.5)
    assert.equal(writes[0]?.feedback, 'Boa modelagem')
    assert.equal(writes[0]?.gradedById, teacher.userId)
  })

  it('forbids a student from grading', async () => {
    const { service } = createService([])

    const result = await service.grade(submissionId, { grade: 10 }, student)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('returns notFound for a submission that does not exist', async () => {
    const { service } = createService([[]])

    const result = await service.grade(submissionId, { grade: 7 }, teacher)

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })
})
