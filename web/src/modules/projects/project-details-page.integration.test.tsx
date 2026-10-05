import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '@/types/project'
import { ProjectDetailsPage } from './project-details-page'

const api = vi.hoisted(() => ({ useGet: vi.fn() }))

vi.mock('@/api', () => ({ useGet: api.useGet }))

function project(id: string): Project {
  return {
    id,
    groupId: 'group-1',
    projectName: `Projeto ${id}`,
    description: 'Descrição do projeto.',
    technologies: [],
    usesOtherTechnology: false,
    dependencyManager: 'pnpm',
    versionControl: 'git',
    repositoryType: 'monorepo',
    repositories: [],
    commitCount: 0,
    branchCount: 0,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-30T10:00:00.000Z',
  }
}

function renderPage(path = '/projects/project-2') {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path='/projects/:projectId' element={<ProjectDetailsPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProjectDetailsPage', () => {
  afterEach(() => api.useGet.mockReset())

  it('loads the project identified by the route parameter', () => {
    api.useGet.mockImplementation((_endpoint, projectId) => ({
      data: project(projectId),
      error: undefined,
      isLoading: false,
    }))

    const html = renderPage()

    expect(html).toContain('Projeto project-2')
  })

  it('announces that project details are loading', () => {
    api.useGet.mockReturnValue({ data: undefined, error: undefined, isLoading: true })

    const html = renderPage()

    expect(html).toContain('role="status"')
    expect(html).toContain('Carregando detalhes do projeto')
  })

  it('announces an error when project details cannot be loaded', () => {
    api.useGet.mockReturnValue({
      data: undefined,
      error: new Error('Request failed'),
      isLoading: false,
    })

    const html = renderPage()

    expect(html).toContain('role="alert"')
    expect(html).toContain('Projeto não encontrado')
  })
})
