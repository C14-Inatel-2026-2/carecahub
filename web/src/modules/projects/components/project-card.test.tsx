import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Group } from '@/types/group'
import { GroupCard, ProjectCard } from './project-card'

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

function renderProjectCard(group: Group) {
  if (!group.project) throw new Error('Expected a group with a project')

  return renderToStaticMarkup(
    <MemoryRouter>
      <ProjectCard group={group} project={group.project} />
    </MemoryRouter>
  )
}

function renderGroupCard(
  group: Group,
  options?: { showOptions?: boolean; onLeaderChange?: (leaderId: string) => Promise<boolean> }
) {
  return renderToStaticMarkup(<GroupCard group={group} {...options} />)
}

describe('ProjectCard', () => {
  afterEach(() => vi.useRealTimers())

  it('shows the saved thumbnail, icon and project color', () => {
    const html = renderProjectCard(groupWithProject({
      thumbnailUrl: 'https://example.com/thumbnail.png',
      iconUrl: 'https://example.com/icon.png',
      mainColor: '#123ABC',
    }))
    expect(html).toContain('src="https://example.com/thumbnail.png"')
    expect(html).toContain('src="https://example.com/icon.png"')
    expect(html).toContain('color:#123ABC')
    expect(html).toContain('border-color:#123ABC')
    expect(html).toContain('box-shadow:0 4px 16px #123ABC40')
  })

  it('renders totals and a direct GitHub link for a monorepo', () => {
    const html = renderProjectCard(
      groupWithProject({
        repositoryType: 'monorepo',
        repositories: [
          { id: 'repo-1', url: 'https://github.com/acme/app', commitCount: 20, branchCount: 3 },
        ],
      })
    )

    expect(html).toMatch(/>20</)
    expect(html).toMatch(/>3</)
    expect(html).toMatch(/href="https:\/\/github\.com\/acme\/app"/)
    expect(html).not.toMatch(/<details/)
  })

  it('keeps multirepo links out of the card flow while the floating menu is closed', () => {
    const html = renderProjectCard(
      groupWithProject({
        repositoryType: 'multirepo',
        repositories: [
          { id: 'repo-1', url: 'https://github.com/acme/web', commitCount: 12, branchCount: 2 },
          { id: 'repo-2', url: 'https://github.com/acme/api', commitCount: 8, branchCount: 1 },
        ],
      })
    )

    expect(html).toContain('Repositórios (2)')
    expect(html).toContain('data-slot="dropdown-menu-trigger"')
    expect(html).not.toMatch(/<details/)
    expect(html).not.toMatch(/href="https:\/\/github\.com\/acme\/(web|api)"/)
  })

  it('renders a group update from today as relative text', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 29, 18, 0))

    const html = renderGroupCard({
      id: 'group-1',
      friendlyId: 'Grupo 1',
      leaderId: 'leader-1',
      members: [],
      createdAt: '2026-09-29T14:30:00',
      updatedAt: '2026-09-29T14:30:00',
    })

    expect(html).toContain('hoje às 14:30')
    expect(html).not.toContain('Última atualização em')
  })

  it('links the project details button to the selected project', () => {
    const html = renderProjectCard(groupWithProject({}))

    expect(html).toContain('href="/projects/CarecaHub"')
    expect(html).toContain('Ver detalhes')
  })

  it('renders the project fallback image for light and dark themes', () => {
    const html = renderProjectCard(groupWithProject({}))

    expect(html).toContain('src="/project-fallback-light.png"')
    expect(html).toContain('class="rounded-lg dark:hidden"')
    expect(html).toContain('src="/project-fallback-dark.png"')
    expect(html).toContain('class="hidden rounded-lg dark:block"')
  })

  it('renders the group fallback image for light and dark themes', () => {
    const html = renderGroupCard({
      id: 'group-1',
      friendlyId: 'Grupo 1',
      leaderId: 'leader-1',
      members: [],
      createdAt: '2026-09-29T14:05:00.000Z',
      updatedAt: '2026-09-29T14:05:00.000Z',
    })

    expect(html).toContain('src="/group-fallback-light.png"')
    expect(html).toContain('class="rounded-lg dark:hidden"')
    expect(html).toContain('src="/group-fallback-dark.png"')
    expect(html).toContain('class="hidden rounded-lg dark:block"')
  })

  it('shows the vertical options button only when enabled', () => {
    const group = {
      id: 'group-1',
      friendlyId: 'Grupo 1',
      leaderId: 'leader-1',
      members: [],
      createdAt: '2026-09-29T14:05:00.000Z',
      updatedAt: '2026-09-29T14:05:00.000Z',
    }

    const withOptions = renderGroupCard(group, {
      showOptions: true,
      onLeaderChange: async () => true,
    })
    const withoutOptions = renderGroupCard(group)

    expect(withOptions).toContain('aria-label="Opções do grupo Grupo 1"')
    expect(withOptions).toContain('lucide-ellipsis-vertical')
    expect(withoutOptions).not.toContain('aria-label="Opções do grupo Grupo 1"')
  })
})
