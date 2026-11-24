import { describe, expect, it } from 'vitest'
import { canShowSubmissionForm } from './activity-details-page'

describe('canShowSubmissionForm', () => {
  const now = new Date('2026-11-24T12:00:00.000Z')

  it('only allows a student with no delivery before the deadline to see the submission form', () => {
    expect(
      canShowSubmissionForm({
        role: 'student',
        dueAt: '2026-11-25T12:00:00.000Z',
        hasSubmission: false,
        isLoadingSubmissions: false,
        now,
      }),
    ).toBe(true)
    expect(
      canShowSubmissionForm({
        role: 'student',
        dueAt: '2026-11-25T12:00:00.000Z',
        hasSubmission: true,
        isLoadingSubmissions: false,
        now,
      }),
    ).toBe(false)
    expect(
      canShowSubmissionForm({
        role: 'student',
        dueAt: '2026-11-24T11:59:59.000Z',
        hasSubmission: false,
        isLoadingSubmissions: false,
        now,
      }),
    ).toBe(false)
  })
})
