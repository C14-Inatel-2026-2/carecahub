import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Dashboard } from '@/types/dashboard'
import { canViewPlatformDashboard, PlatformDashboardContent } from './platform-dashboard'

const dashboard: Dashboard = {
  metrics: { students: 12, groups: 4, projects: 3, repositories: 5 },
  commitsByDay: [
    { date: '2026-09-29', count: 2 },
    { date: '2026-09-30', count: 7 },
  ],
  commitsByClassroom: [
    { classroom: 'A1', count: 6 },
    { classroom: 'Não identificada', count: 3 },
  ],
  projectRanking: [
    { projectId: 'p1', projectName: 'CarecaHub', commitCount: 120 },
    { projectId: 'p2', projectName: 'Second', commitCount: 80 },
  ],
  githubDataComplete: false,
}

describe('platform dashboard', () => {
  it('is available to staff roles but not students', () => {
    expect(canViewPlatformDashboard('admin')).toBe(true)
    expect(canViewPlatformDashboard('teacher')).toBe(true)
    expect(canViewPlatformDashboard('mentor')).toBe(true)
    expect(canViewPlatformDashboard('student')).toBe(false)
  })

  it('renders metric cards, commit charts, ranking, and the partial-data warning', () => {
    const html = renderToStaticMarkup(<PlatformDashboardContent dashboard={dashboard} />)

    for (const label of [
      'Quantidade de alunos',
      'Quantidade de grupos',
      'Quantidade de projetos',
      'Quantidade de repositórios',
    ]) {
      expect(html).toContain(label)
    }
    expect(html).toContain('Commits por dia')
    expect(html).toContain('Commits por turma')
    expect(html).toContain('Projetos com mais commits')
    expect(html).toContain('CarecaHub')
    expect(html).toContain('120')
    expect(html).toContain('Alguns repositórios não puderam ser consultados')
  })
})
