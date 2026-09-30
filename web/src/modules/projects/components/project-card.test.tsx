import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Group } from '@/types/group'
import { ProjectCard } from './project-card'

function groupWithProject(overrides: Partial<NonNullable<Group['project']>>): Group {
  return {
    id: 'group-1',
    friendlyId: 'Grupo 1',
    leaderId: 'leader-1',
    members: [],
    createdAt: '2026-09-29T14:05:00.000Z',
    updatedAt: '2026-09-29T14:05:00.000Z',
    project: {
      id: 'project-1',
      projectName: 'CarecaHub',
      createdAt: '2026-09-29T14:05:00.000Z',
      updatedAt: '2026-09-29T14:05:00.000Z',
      commitCount: 20,
      branchCount: 3,
      ...overrides,
      repositories: overrides.repositories ?? [],
    },
  }
}

describe('ProjectCard', () => {
  afterEach(() => vi.useRealTimers())

  it('renders totals and a direct GitHub link for a monorepo', () => {
    const html = renderToStaticMarkup(
      <ProjectCard
        group={groupWithProject({
          repositoryType: 'monorepo',
          repositories: [
            { id: 'repo-1', url: 'https://github.com/acme/app', commitCount: 20, branchCount: 3 },
          ],
        })}
      />
    )

    expect(html).toMatch(/>20</)
    expect(html).toMatch(/>3</)
    expect(html).toMatch(/href="https:\/\/github\.com\/acme\/app"/)
    expect(html).not.toMatch(/<details/)
  })

  it('keeps multirepo links out of the card flow while the floating menu is closed', () => {
    const html = renderToStaticMarkup(
      <ProjectCard
        group={groupWithProject({
          repositoryType: 'multirepo',
          repositories: [
            { id: 'repo-1', url: 'https://github.com/acme/web', commitCount: 12, branchCount: 2 },
            { id: 'repo-2', url: 'https://github.com/acme/api', commitCount: 8, branchCount: 1 },
          ],
        })}
      />
    )

    expect(html).toContain('Repositórios (2)')
    expect(html).toContain('data-slot="dropdown-menu-trigger"')
    expect(html).not.toMatch(/<details/)
    expect(html).not.toMatch(/href="https:\/\/github\.com\/acme\/(web|api)"/)
  })

  it('renders a group update from today as relative text', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 29, 18, 0))

    const html = renderToStaticMarkup(
      <ProjectCard
        group={{
          id: 'group-1',
          friendlyId: 'Grupo 1',
          leaderId: 'leader-1',
          members: [],
          createdAt: '2026-09-29T14:30:00',
          updatedAt: '2026-09-29T14:30:00',
        }}
      />
    )

    expect(html).toContain('hoje às 14:30')
    expect(html).not.toContain('Última atualização em')
  })
})
