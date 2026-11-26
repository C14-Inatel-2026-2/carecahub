import { describe, expect, it } from 'vitest'
import type { Activity } from '@/types/activity'
import {
  getActivitiesByDueDate,
  getNextStudentActivitySectionUpdate,
  getStudentActivitySections,
} from './activity-list-groups'

const now = new Date('2026-11-24T12:00:00.000Z')

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: 'activity-1',
    title: 'Atividade',
    description: 'Descrição',
    dueAt: '2026-11-25T12:00:00.000Z',
    allowLateSubmissions: false,
    submissionType: 'both',
    createdById: 'teacher-1',
    publishedAt: '2026-11-20T12:00:00.000Z',
    deadlineRevision: 1,
    archivedAt: null,
    createdAt: '2026-11-20T12:00:00.000Z',
    updatedAt: '2026-11-20T12:00:00.000Z',
    attachments: [],
    ...overrides,
  }
}

describe('getStudentActivitySections', () => {
  it('separates delivered, overdue and pending activities while preserving deadline order', () => {
    const sections = getStudentActivitySections(
      [
        activity({
          id: 'delivered',
          title: 'Relatório entregue',
          dueAt: '2026-11-23T12:00:00.000Z',
          submission: { id: 'submission-1', submittedAt: '2026-11-24T10:00:00.000Z', isLate: true },
        }),
        activity({ id: 'overdue-later', title: 'Exercício 2', dueAt: '2026-11-20T17:00:00.000Z' }),
        activity({ id: 'todo', title: 'Próxima atividade', dueAt: '2026-11-25T12:00:00.000Z' }),
        activity({ id: 'overdue-first', title: 'Exercício 1', dueAt: '2026-11-20T12:00:00.000Z' }),
      ],
      now
    )

    expect(sections.submitted.flatMap((group) => group.activities.map((item) => item.id))).toEqual([
      'delivered',
    ])
    expect(sections.overdue.flatMap((group) => group.activities.map((item) => item.id))).toEqual([
      'overdue-first',
      'overdue-later',
    ])
    expect(sections.todo.flatMap((group) => group.activities.map((item) => item.id))).toEqual([
      'todo',
    ])
    expect(sections.overdue[0].label).toBe('20 de novembro de 2026')
  })

  it('keeps an activity due exactly now in the todo section', () => {
    const sections = getStudentActivitySections(
      [activity({ id: 'deadline-now', dueAt: now.toISOString() })],
      now
    )

    expect(sections.todo[0].activities.map((item) => item.id)).toEqual(['deadline-now'])
    expect(sections.overdue).toEqual([])
  })

  it('schedules a refresh immediately after the next pending deadline', () => {
    const updateAt = getNextStudentActivitySectionUpdate(
      [
        activity({ id: 'later', dueAt: '2026-11-26T12:00:00.000Z' }),
        activity({ id: 'next', dueAt: '2026-11-25T12:00:00.000Z' }),
        activity({
          id: 'submitted',
          dueAt: '2026-11-24T12:00:00.000Z',
          submission: { id: 'submission-1', submittedAt: now.toISOString(), isLate: false },
        }),
      ],
      now,
    )

    expect(updateAt).toEqual(new Date('2026-11-25T12:00:00.001Z'))
  })
})

describe('getActivitiesByDueDate', () => {
  it('groups activities by their deadline in ascending date order', () => {
    const groups = getActivitiesByDueDate([
      activity({ id: 'later', dueAt: '2026-11-26T12:00:00.000Z' }),
      activity({ id: 'first', dueAt: '2026-11-25T17:00:00.000Z' }),
      activity({ id: 'second', dueAt: '2026-11-25T12:00:00.000Z' }),
    ])

    expect(groups.map((group) => group.label)).toEqual([
      '25 de novembro de 2026',
      '26 de novembro de 2026',
    ])
    expect(groups[0].activities.map((item) => item.id)).toEqual(['second', 'first'])
  })
})
