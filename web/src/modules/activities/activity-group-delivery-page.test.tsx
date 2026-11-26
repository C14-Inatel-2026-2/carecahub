import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Activity, ActivityGroupDelivery } from '@/types/activity'
import { ActivityGroupDeliveryContent, canEvaluateDelivery } from './activity-group-delivery-page'

const activity: Activity = {
  id: 'activity-1',
  title: 'Entrega final',
  description: '<p>Envie a versão final.</p>',
  dueAt: '2026-10-20T23:59:00.000Z',
  allowLateSubmissions: false,
  submissionType: 'both',
  createdById: 'teacher-1',
  publishedAt: '2026-10-10T10:00:00.000Z',
  deadlineRevision: 0,
  archivedAt: null,
  createdAt: '2026-10-10T10:00:00.000Z',
  updatedAt: '2026-10-10T10:00:00.000Z',
  attachments: [],
}

const delivery: ActivityGroupDelivery = {
  group: {
    id: 'group-1',
    friendlyId: 'Grupo 1',
    leaderId: 'leader-1',
    tags: ['space_available'],
    members: [
      {
        id: 'student-1',
        groupId: 'group-1',
        name: 'Ana',
        registration: 1,
        githubName: 'ana',
        classroom: 'A1',
        email: 'ana@example.com',
        role: 'student',
        status: 'active',
        twoFactor: false,
        createdAt: '2026-10-10T10:00:00.000Z',
        updatedAt: '2026-10-10T10:00:00.000Z',
        gitHubDetails: {
          login: 'ana',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1',
          profileUrl: 'https://github.com/ana',
          bio: null,
          createdAt: '2020-01-01T10:00:00.000Z',
          publicRepos: 1,
        },
      },
    ],
    project: null,
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
  },
  project: {
    id: 'project-1',
    groupId: 'group-1',
    projectName: 'CarecaHub',
    repositories: [],
    commitCount: 0,
    branchCount: 0,
    iconUrl: 'https://example.com/icon.png',
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
  },
  viewers: [{ id: 'student-1', name: 'Ana' }],
  submissions: [
    {
      id: 'submission-1',
      groupId: 'group-1',
      version: 1,
      isLate: false,
      invalidatedAt: null,
      submittedAt: '2026-10-12T10:00:00.000Z',
      score: null,
      submittedBy: { id: 'student-1', name: 'Ana' },
      links: [],
      files: [],
    },
  ],
}

describe('ActivityGroupDeliveryContent', () => {
  it('shows the selected group delivery and keeps administrators read-only', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ActivityGroupDeliveryContent activity={activity} canEvaluate={false} delivery={delivery} />
      </MemoryRouter>
    )

    expect(html).toContain('Entrega final')
    expect(html).toContain('Grupo 1')
    expect(html).toContain('CarecaHub')
    expect(html).toContain('src="https://avatars.githubusercontent.com/u/1"')
    expect(html).toContain('alt="Ana"')
    expect(html).toContain('Entrega versão 1')
    expect(html).not.toContain('Avaliar')
  })

  it('allows only teachers and mentors to evaluate the selected group delivery', () => {
    expect(canEvaluateDelivery('teacher')).toBe(true)
    expect(canEvaluateDelivery('mentor')).toBe(true)
    expect(canEvaluateDelivery('admin')).toBe(false)
    expect(canEvaluateDelivery('student')).toBe(false)
  })

  it('shows an empty delivery history for a group with no submissions', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ActivityGroupDeliveryContent
          activity={activity}
          canEvaluate={true}
          delivery={{ ...delivery, submissions: [] }}
        />
      </MemoryRouter>
    )

    expect(html).toContain('Nenhuma entrega registrada.')
  })
})
