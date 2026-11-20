import { describe, expect, it } from 'vitest'
import { activityFormSchema, gradeFormSchema, submissionFormSchema } from '@/types/activity'
import { canManageActivities, canSubmit, getActivityStatus } from './activity-helpers'

const now = new Date('2026-11-13T12:00:00.000Z')
const future = '2026-11-20T23:59:00.000Z'
const past = '2026-11-01T23:59:00.000Z'

describe('getActivityStatus', () => {
  it('is open before the due date', () => {
    expect(getActivityStatus({ dueDate: future, allowLateSubmissions: false }, now)).toBe('open')
  })

  it('accepts late submissions after the due date only when the teacher allowed it', () => {
    expect(getActivityStatus({ dueDate: past, allowLateSubmissions: true }, now)).toBe('late')
    expect(getActivityStatus({ dueDate: past, allowLateSubmissions: false }, now)).toBe('closed')
  })
})

describe('canSubmit', () => {
  it('blocks a new submission once the previous one was graded', () => {
    const activity = { dueDate: future, allowLateSubmissions: false }
    expect(canSubmit(activity, { gradedAt: null }, now)).toBe(true)
    expect(canSubmit(activity, { gradedAt: '2026-11-12T10:00:00.000Z' }, now)).toBe(false)
  })

  it('blocks submissions after the deadline when late submissions are disabled', () => {
    expect(canSubmit({ dueDate: past, allowLateSubmissions: false }, null, now)).toBe(false)
  })
})

describe('canManageActivities', () => {
  it('only lets teachers and admins manage activities', () => {
    expect(canManageActivities({ role: 'teacher' })).toBe(true)
    expect(canManageActivities({ role: 'admin' })).toBe(true)
    expect(canManageActivities({ role: 'mentor' })).toBe(false)
    expect(canManageActivities({ role: 'student' })).toBe(false)
    expect(canManageActivities(undefined)).toBe(false)
  })
})

describe('activity forms', () => {
  it('points to the title when it is missing', () => {
    const result = activityFormSchema.safeParse({
      title: '   ',
      description: 'Instruções',
      dueDate: '2026-12-01T10:00',
      allowLateSubmissions: false,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['title'])
  })

  it('rejects a submission that is not a link', () => {
    expect(submissionFormSchema.safeParse({ url: 'meu trabalho' }).success).toBe(false)
    expect(submissionFormSchema.safeParse({ url: 'https://github.com/acme/app' }).success).toBe(
      true
    )
  })

  it('keeps the grade between 0 and 10', () => {
    expect(gradeFormSchema.safeParse({ grade: 11 }).success).toBe(false)
    expect(gradeFormSchema.safeParse({ grade: 8.5, feedback: 'Bom trabalho' }).success).toBe(true)
  })
})
