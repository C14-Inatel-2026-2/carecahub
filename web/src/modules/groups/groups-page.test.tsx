import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { LoggedUser } from '@/types/auth'
import type { Group } from '@/types/group'
import { GroupsPage } from './groups-page'

const mocks = vi.hoisted(() => ({
  useList: vi.fn(),
  useDebounce: vi.fn(() => 'busca atrasada'),
  mutate: vi.fn(),
  user: {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    groupId: null,
  } as LoggedUser,
}))

vi.mock('@/api', () => ({ useList: mocks.useList }))
vi.mock('@/lib/use-debounce', () => ({ useDebounce: mocks.useDebounce }))
vi.mock('@/mocks/config', () => ({ isMockAPIEnabled: false }))
vi.mock('@/stores/use-user', () => ({
  useUser: (selector: (state: { user: LoggedUser }) => unknown) => selector({ user: mocks.user }),
}))

const group: Group = {
  id: 'group-1',
  friendlyId: 'Grupo 1',
  leaderId: 'leader-1',
  tags: ['space_available', 'no_project'],
  project: null,
  members: [
    {
      id: 'leader-1',
      groupId: 'group-1',
      name: 'Líder com avatar',
      registration: 123,
      githubName: 'leader',
      classroom: 'A',
      email: 'leader@example.com',
      role: 'student',
      status: 'active',
      twoFactor: false,
      createdAt: '2026-09-29T14:05:00.000Z',
      updatedAt: '2026-09-29T14:05:00.000Z',
      gitHubDetails: {
        login: 'leader',
        avatarUrl: 'https://avatars.example.com/leader.png',
        profileUrl: 'https://github.com/leader',
        bio: null,
        createdAt: '2020-01-01T00:00:00.000Z',
        publicRepos: 4,
      },
    },
    {
      id: 'member-1',
      groupId: 'group-1',
      name: 'Membro sem avatar',
      registration: 456,
      githubName: null,
      classroom: 'A',
      email: 'member@example.com',
      role: 'student',
      status: 'active',
      twoFactor: false,
      createdAt: '2026-09-29T14:05:00.000Z',
      updatedAt: '2026-09-29T14:05:00.000Z',
    },
  ],
  createdAt: '2026-09-29T14:05:00.000Z',
  updatedAt: '2026-09-29T14:05:00.000Z',
}

describe('GroupsPage', () => {
  it('uses the shared group card with tags, member icons and management options', () => {
    mocks.useList.mockReturnValue({ data: [group], isLoading: false, mutate: mocks.mutate })

    const html = renderToStaticMarkup(<GroupsPage />)

    expect(html).toContain('ESPAÇO DISPONÍVEL')
    expect(html).toContain('SEM PROJETO')
    expect(html).toContain('src="https://avatars.example.com/leader.png"')
    expect(html).toContain('lucide-user')
    expect(html).toContain('aria-label="Opções do grupo Grupo 1"')
  })

  it('renders a group search field and sends the group search scope', () => {
    mocks.useList.mockReturnValue({ data: [], isLoading: false, mutate: mocks.mutate })

    const html = renderToStaticMarkup(<GroupsPage />)

    expect(html).toContain('placeholder="Buscar grupos ou membros…"')
    expect(mocks.useList).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/groups',
      params: expect.objectContaining({ search: 'busca atrasada', searchScope: 'groups' }),
    }))
    expect(mocks.useDebounce).toHaveBeenCalledWith('', 350)
  })
})
