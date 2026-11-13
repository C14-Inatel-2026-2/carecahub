import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Activity, Submission } from '@/types/activity'
import { StudentSubmissionCard } from './student-submission-card'

const activity: Activity = {
  id: 'activity-1',
  title: 'Entrega 1',
  description: 'Modelagem do banco',
  dueDate: '2030-01-01T23:59:00.000Z',
  allowLateSubmissions: false,
  createdById: 'teacher-id',
  isClosed: false,
}

const submission: Submission = {
  id: 'submission-1',
  activityId: 'activity-1',
  groupId: 'group-1',
  submittedById: 'student-id',
  url: 'https://github.com/acme/app',
  isLate: false,
  submittedAt: '2026-11-13T12:00:00.000Z',
  grade: 9,
  feedback: 'Ótima modelagem',
  gradedById: 'teacher-id',
  gradedAt: '2026-11-14T12:00:00.000Z',
}

describe('StudentSubmissionCard', () => {
  it('offers the submission form while the activity is open', () => {
    const html = renderToStaticMarkup(
      <StudentSubmissionCard activity={activity} onSubmitted={vi.fn()} />
    )
    expect(html).toContain('Enviar entrega')
  })

  it('shows the grade and hides the form after the teacher graded', () => {
    const html = renderToStaticMarkup(
      <StudentSubmissionCard activity={activity} submission={submission} onSubmitted={vi.fn()} />
    )
    expect(html).toContain('Ótima modelagem')
    expect(html).toContain('não pode mais ser substituída')
    expect(html).not.toContain('Substituir entrega')
  })

  it('explains why a closed activity no longer accepts submissions', () => {
    const closed = { ...activity, dueDate: '2020-01-01T00:00:00.000Z', isClosed: true }
    const html = renderToStaticMarkup(
      <StudentSubmissionCard activity={closed} onSubmitted={vi.fn()} />
    )
    expect(html).toContain('não aceita entregas atrasadas')
    expect(html).not.toContain('Enviar entrega')
  })
})
