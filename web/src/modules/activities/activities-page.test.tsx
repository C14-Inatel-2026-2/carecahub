// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig, unstable_serialize } from 'swr'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUser } from '@/stores/use-user'
import type { Activity } from '@/types/activity'
import type { LoggedUser } from '@/types/auth'
import { ActivitiesPage } from './activities-page'

const student: LoggedUser = {
  id: 'student-1',
  name: 'Student',
  email: 'student@example.com',
  role: 'student',
}

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

function renderPage(user: LoggedUser, activities: Activity[]) {
  useUser.setState({ user, isLoading: false })
  const key = unstable_serialize({
    url: '/activities?skip=0&take=100',
    userId: user.id,
  })

  render(
    <SWRConfig
      value={{
        provider: () => new Map(),
        fallback: { [key]: { totalCount: activities.length, data: activities } },
        revalidateIfStale: false,
        revalidateOnFocus: false,
      }}
    >
      <MemoryRouter>
        <ActivitiesPage />
      </MemoryRouter>
    </SWRConfig>,
  )
}

describe('ActivitiesPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-24T12:00:00.000Z'))
  })

  afterEach(() => {
    cleanup()
    useUser.setState({ user: undefined, isLoading: false })
    vi.useRealTimers()
  })

  it('renders student activities in delivery-status sections with due-date labels', () => {
    renderPage(student, [
      activity({
        id: 'submitted',
        title: 'Relatório entregue',
        dueAt: '2026-11-20T12:00:00.000Z',
        submission: { id: 'submission-1', submittedAt: '2026-11-21T12:00:00.000Z', isLate: true },
      }),
      activity({ id: 'overdue', title: 'Atividade atrasada', dueAt: '2026-11-21T12:00:00.000Z' }),
      activity({ id: 'todo', title: 'Próxima atividade', dueAt: '2026-12-25T12:00:00.000Z' }),
    ])

    expect(screen.getByText('A fazer')).toBeTruthy()
    expect(screen.getByText('Atrasadas/Não entregues')).toBeTruthy()
    expect(screen.getByText('Entregues')).toBeTruthy()
    expect(screen.getByText('Próxima atividade')).toBeTruthy()
    expect(screen.getByText('Atividade atrasada')).toBeTruthy()
    expect(screen.getByText('Relatório entregue')).toBeTruthy()
    expect(screen.getByText('25 de dezembro de 2026')).toBeTruthy()
  })

  it('keeps the ungrouped list for staff members', () => {
    renderPage(
      { ...student, id: 'teacher-1', role: 'teacher' },
      [activity({ title: 'Atividade da turma' })],
    )

    expect(screen.getByText('Atividade da turma')).toBeTruthy()
    expect(screen.queryByText('Atrasadas/Não entregues')).toBeNull()
    expect(screen.queryByText('Entregues')).toBeNull()
  })
})
