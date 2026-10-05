import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MyProjectPage } from '../src/modules/my-project/my-project-page'
import type { LoggedUser } from '../src/types/auth'
import type { Group } from '../src/types/group'

const mocks = vi.hoisted(() => ({
  user: {
    id: 'user-1',
    name: 'Aluno',
    email: 'aluno@example.com',
    role: 'student',
    groupId: null,
  } as LoggedUser,
  setUser: vi.fn(),
  useGet: vi.fn(),
  onCreated: undefined as undefined | ((group: Group) => void),
}))

vi.mock('@/api', () => ({ useGet: mocks.useGet }))
vi.mock('@/mocks/config', () => ({ isMockAPIEnabled: false }))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('@/stores/use-user', () => ({
  useUser: (selector: (state: { user: LoggedUser; setUser: typeof mocks.setUser }) => unknown) =>
    selector({ user: mocks.user, setUser: mocks.setUser }),
}))
vi.mock('@/modules/groups/dialogs/create-group-dialog', () => ({
  CreateGroupDialog: ({ onCreated }: { onCreated: (group: Group) => void }) => {
    mocks.onCreated = onCreated
    return <button type='button'>Novo grupo</button>
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.user.groupId = null
  mocks.useGet.mockReturnValue({ data: undefined, isLoading: false, mutate: vi.fn() })
})

describe('MyProjectPage group creation', () => {
  it('updates the session with the created group while preserving the user details', () => {
    renderToStaticMarkup(<MyProjectPage />)
    mocks.onCreated!({ id: 'group-1' } as Group)
    expect(mocks.setUser).toHaveBeenCalledWith({ ...mocks.user, groupId: 'group-1' })
  })

  it('fetches the new group as soon as the updated session is rendered', () => {
    renderToStaticMarkup(<MyProjectPage />)
    mocks.onCreated!({ id: 'group-1' } as Group)
    mocks.user = mocks.setUser.mock.calls[0][0]
    renderToStaticMarkup(<MyProjectPage />)
    expect(mocks.useGet).toHaveBeenLastCalledWith('/groups/:id', 'group-1')
  })
})
