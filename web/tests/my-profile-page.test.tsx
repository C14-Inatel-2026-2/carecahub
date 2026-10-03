import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MyProfilePage } from '../src/modules/my-profile/my-profile-page'

const mocks = vi.hoisted(() => ({
  useSWR: vi.fn(),
  navigate: vi.fn(),
  loggedUser: null as { id: string } | null,
}))

vi.mock('swr', () => ({ default: mocks.useSWR }))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}))

vi.mock('@/stores/use-user', () => ({
  useUser: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: mocks.loggedUser }),
}))

vi.mock('@/components/profile-details', () => ({
  ProfileDetails: ({ user }: { user: { name: string } }) => <div>Perfil: {user.name}</div>,
}))

describe('MyProfilePage', () => {
  beforeEach(() => {
    mocks.useSWR.mockReset()
    mocks.navigate.mockReset()
    mocks.loggedUser = null
  })

  it('loads and displays the authenticated user profile', () => {
    mocks.loggedUser = { id: 'user-123' }
    mocks.useSWR.mockReturnValue({
      data: { id: 'user-123', name: 'Lara' },
      isLoading: false,
      error: undefined,
    })

    const markup = renderToStaticMarkup(<MyProfilePage />)

    expect(mocks.useSWR).toHaveBeenCalledWith({ url: '/users/user-123' }, expect.any(Function))
    expect(markup).toContain('Perfil: Lara')
  })

  it('shows the empty state instead of profile details when no profile is returned', () => {
    mocks.loggedUser = { id: 'missing-user' }
    mocks.useSWR.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    })

    const markup = renderToStaticMarkup(<MyProfilePage />)

    expect(markup).toContain('Usuário não encontrado')
    expect(markup).not.toContain('Perfil:')
  })
})
