import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Group } from '@/types/group'
import { ProjectsPage } from './projects-page'

const mocks = vi.hoisted(() => ({
  useList: vi.fn(),
  useDebounce: vi.fn(() => 'busca atrasada'),
}))

vi.mock('@/api', () => ({ useList: mocks.useList }))
vi.mock('@/lib/use-debounce', () => ({ useDebounce: mocks.useDebounce }))
vi.mock('@/mocks/config', () => ({ isMockAPIEnabled: false }))

const projectGroup: Group = {
  id: 'group-with-project',
  friendlyId: 'Grupo com projeto',
  leaderId: 'leader-1',
  members: [],
  createdAt: '2026-09-29T14:05:00.000Z',
  updatedAt: '2026-09-29T14:05:00.000Z',
  project: {
    id: 'project-1',
    projectName: 'CarecaHub',
    commitCount: 20,
    branchCount: 3,
    repositories: [],
    createdAt: '2026-09-29T14:05:00.000Z',
    updatedAt: '2026-09-29T14:05:00.000Z',
  },
}

const projectlessGroup: Group = {
  id: 'group-without-project',
  friendlyId: 'Grupo sem projeto',
  leaderId: 'leader-2',
  members: [],
  project: null,
  createdAt: '2026-09-29T14:05:00.000Z',
  updatedAt: '2026-09-29T14:05:00.000Z',
}

function renderPage(groups: Group[]) {
  mocks.useList.mockReturnValue({ data: groups, isLoading: false })

  return renderToStaticMarkup(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>
  )
}

describe('ProjectsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('separates project cards and projectless group cards into named sections', () => {
    const html = renderPage([projectlessGroup, projectGroup])
    const projectsHeading = html.indexOf('>Projetos</h2>')
    const projectName = html.indexOf('>CarecaHub</span>')
    const groupsHeading = html.indexOf('>Grupos</h2>')
    const groupName = html.indexOf('>Grupo sem projeto</span>')

    expect(html).toContain('Projetos e grupos')
    expect(projectsHeading).toBeGreaterThan(-1)
    expect(projectsHeading).toBeLessThan(projectName)
    expect(projectName).toBeLessThan(groupsHeading)
    expect(groupsHeading).toBeLessThan(groupName)
  })

  it('renders a project search field and sends the project search scope', () => {
    const html = renderPage([])

    expect(html).toContain('placeholder="Buscar projetos, repositórios ou membros…"')
    expect(mocks.useList).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/groups',
      params: expect.objectContaining({ search: 'busca atrasada', searchScope: 'projects' }),
    }))
    expect(mocks.useDebounce).toHaveBeenCalledWith('', 350)
  })

  it('omits the projects section when no group has a project', () => {
    const html = renderPage([projectlessGroup])

    expect(html).not.toMatch(/<h2[^>]*>Projetos<\/h2>/)
    expect(html).toMatch(/<h2[^>]*>Grupos<\/h2>/)
  })

  it('omits the groups section when every group has a project', () => {
    const html = renderPage([projectGroup])

    expect(html).toMatch(/<h2[^>]*>Projetos<\/h2>/)
    expect(html).not.toMatch(/<h2[^>]*>Grupos<\/h2>/)
  })
})
