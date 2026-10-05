import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LoggedUser } from '@/types/auth'
import type { Group } from '@/types/group'
import type { User } from '@/types/user'
import { MyProjectPage } from './my-project-page'

const mocks = vi.hoisted(() => ({
  useGet: vi.fn(),
  writer: vi.fn(),
  mutate: vi.fn(),
  userCardProps: new Map<string, { onRemove?: () => Promise<boolean> }>(),
  user: {
    id: 'leader-1',
    name: 'Líder',
    email: 'leader@example.com',
    role: 'student',
    groupId: 'group-1',
  } as LoggedUser,
}))

vi.mock('@/api', () => ({ useGet: mocks.useGet }))
vi.mock('@/api/writer', () => ({ writer: mocks.writer }))
vi.mock('@/mocks/config', () => ({ isMockAPIEnabled: false }))
vi.mock('@/stores/use-user', () => ({
  useUser: (
    selector: (state: { user: LoggedUser; setUser: ReturnType<typeof vi.fn> }) => unknown
  ) => selector({ user: mocks.user, setUser: vi.fn() }),
}))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('./components/user-card', () => ({
  UserCard: ({ user, ...props }: { user: User; onRemove?: () => Promise<boolean> }) => {
    mocks.userCardProps.set(user.id, props)
    return <div>{user.name}</div>
  },
}))
vi.mock('./dialogs/invite-user-dialog', () => ({ InviteUserDialog: () => null }))

const member = (id: string, name: string): User => ({
  id,
  groupId: 'group-1',
  name,
  registration: 123,
  githubName: id,
  classroom: 'A',
  email: `${id}@example.com`,
  role: 'student',
  status: 'active',
  twoFactor: false,
  createdAt: '2026-09-29T14:05:00.000Z',
  updatedAt: '2026-09-29T14:05:00.000Z',
})

const group: Group = {
  id: 'group-1',
  friendlyId: 'Grupo 1',
  leaderId: 'leader-1',
  members: [member('leader-1', 'Líder'), member('member-1', 'Membro')],
  project: null,
  createdAt: '2026-09-29T14:05:00.000Z',
  updatedAt: '2026-09-29T14:05:00.000Z',
}

describe('MyProjectPage member removal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.userCardProps.clear()
    mocks.user = {
      id: 'leader-1',
      name: 'Líder',
      email: 'leader@example.com',
      role: 'student',
      groupId: 'group-1',
    } as LoggedUser
    mocks.useGet.mockReturnValue({ data: group, isLoading: false, mutate: mocks.mutate })
  })

  it('removes another member and refreshes the group after success', async () => {
    mocks.writer.mockResolvedValue({ ok: true, data: undefined })
    renderToStaticMarkup(<MyProjectPage />)

    const removed = await mocks.userCardProps.get('member-1')?.onRemove?.()

    expect(mocks.userCardProps.get('leader-1')?.onRemove).toBeUndefined()
    expect(mocks.writer).toHaveBeenCalledWith('DELETE /groups/:id/users/:userId', {
      params: { id: 'group-1', userId: 'member-1' },
      onSuccessMessage: 'Membro removido',
    })
    expect(mocks.mutate).toHaveBeenCalledOnce()
    expect(removed).toBe(true)
  })

  it('does not refresh the group when removal fails', async () => {
    mocks.writer.mockResolvedValue({ ok: false, error: { message: 'Falha' } })
    renderToStaticMarkup(<MyProjectPage />)

    const removed = await mocks.userCardProps.get('member-1')?.onRemove?.()

    expect(mocks.mutate).not.toHaveBeenCalled()
    expect(removed).toBe(false)
  })

  it.each([
    ['regular member', { ...mocks.user, id: 'member-1' } as LoggedUser],
    [
      'administrator who is not the leader',
      { ...mocks.user, id: 'admin-1', role: 'admin' } as LoggedUser,
    ],
  ])('does not offer member removal to %s', (_case, user) => {
    mocks.user = user
    renderToStaticMarkup(<MyProjectPage />)

    expect([...mocks.userCardProps.values()].every((props) => !props.onRemove)).toBe(true)
  })
})
