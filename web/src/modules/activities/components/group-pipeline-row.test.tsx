import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { GroupRow } from '@/types/activity'
import { GroupPipelineRow } from './group-pipeline-row'

const project = {
  id: 'project-1',
  groupId: 'group-1',
  projectName: 'CarecaHub',
  description: 'Plataforma da turma',
  technologies: ['TypeScript'],
  usesOtherTechnology: false,
  otherTechnology: null,
  dependencyManager: 'pnpm',
  otherDependencyManager: null,
  versionControl: 'git',
  otherVersionControl: null,
  repositoryType: 'monorepo' as const,
  tags: ['monorepo' as const],
  repositories: [],
  commitCount: 0,
  branchCount: 0,
  iconUrl: 'https://example.com/project-icon.png',
  thumbnailUrl: null,
  mainColor: '#123456',
  createdAt: '2026-10-12T10:00:00.000Z',
  updatedAt: '2026-10-12T10:00:00.000Z',
}

const group: GroupRow = {
  group: {
    id: 'group-1',
    friendlyId: 'Grupo 1',
    leaderId: 'leader-1',
    tags: ['space_available'],
    members: [],
    project,
    createdAt: '2026-10-12T10:00:00.000Z',
    updatedAt: '2026-10-12T10:00:00.000Z',
  },
  project,
  viewers: ['Ana'],
  submission: null,
}

describe('GroupPipelineRow', () => {
  it('renders complete group and project visual information', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GroupPipelineRow activityId='activity-1' group={group} />
      </MemoryRouter>
    )

    expect(html).toContain('Grupo 1')
    expect(html).toContain('CarecaHub')
    expect(html).toContain('src="https://example.com/project-icon.png"')
    expect(html).not.toContain('Visualizado por: Ana')
    expect(html).toContain('href="/activities/activity-1/groups/group-1"')
  })
})
