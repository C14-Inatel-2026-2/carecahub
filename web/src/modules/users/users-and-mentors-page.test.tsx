import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MentorsPage } from '@/modules/mentors/mentors-page'
import type { LoggedUser } from '@/types/auth'
import type { User, UserAnalyticsResponse } from '@/types/user'
import { UsersPage } from './users-page'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  useList: vi.fn(),
  user: {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
  } as LoggedUser,
}))

vi.mock('@/api', () => ({ useList: mocks.useList }))
vi.mock('@/mocks/config', () => ({ isMockAPIEnabled: false }))
vi.mock('@/stores/use-user', () => ({
  useUser: (selector: (state: { user: LoggedUser }) => unknown) => selector({ user: mocks.user }),
}))
vi.mock('./use-user-analytics', () => ({
  useUserAnalytics: () => ({
    data: {} as UserAnalyticsResponse,
    error: undefined,
    isLoading: false,
    mutate: mocks.mutate,
  }),
}))

const user: User = {
  id: 'mentor-1',
  name: 'Monitor da Silva',
  email: 'monitor@example.com',
  registration: 12345,
  githubName: 'monitor-da-silva',
  classroom: null,
  role: 'mentor',
  status: 'active',
  twoFactor: false,
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
}

function renderPage(Page: typeof UsersPage | typeof MentorsPage) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <Page />
    </MemoryRouter>
  )
}

describe('users and mentors tables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useList.mockReturnValue({ data: [user], isLoading: false, mutate: mocks.mutate })
  })

  it('renders the common user details in both tables', () => {
    const usersTable = renderPage(UsersPage)
    const mentorsTable = renderPage(MentorsPage)

    for (const table of [usersTable, mentorsTable]) {
      expect(table).toContain('Nome')
      expect(table).toContain('E-mail')
      expect(table).toContain('Função')
      expect(table).toContain('Status')
      expect(table).toContain('Monitor da Silva')
      expect(table).toContain('monitor@example.com')
      expect(table).toContain('Monitor')
      expect(table).toContain('Ativo')
    }

    expect(usersTable).toContain('Matrícula')
    expect(usersTable).toContain('Turma')
  })
})
