import { StrictMode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthLayout } from '../src/components/layout/auth-layout'

const mocks = vi.hoisted(() => ({
  state: { user: undefined, isLoading: false, loadUser: vi.fn() },
  toastError: vi.fn(),
}))

vi.mock('@/stores/use-user', () => ({ useUser: () => mocks.state }))
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }))
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
    <span data-redirect={to} data-replace={replace} />
  ),
  Outlet: () => <span>Conteúdo protegido</span>,
}))
vi.mock('@/components/layout/app-sidebar', () => ({ AppSidebar: () => null }))

beforeEach(() => {
  mocks.state.isLoading = false
  mocks.toastError.mockClear()
})

describe('AuthLayout without a session', () => {
  it('redirects to login silently after logout, including repeated renders', () => {
    for (let render = 0; render < 2; render++) {
      const html = renderToStaticMarkup(
        <StrictMode>
          <AuthLayout />
        </StrictMode>
      )
      expect(html).toContain('data-redirect="/login"')
      expect(html).toContain('data-replace="true"')
      expect(html).not.toContain('Conteúdo protegido')
    }
    expect(mocks.toastError).not.toHaveBeenCalled()
  })

  it('waits for the session before redirecting and never shows a login warning', () => {
    mocks.state.isLoading = true
    const html = renderToStaticMarkup(<AuthLayout />)
    expect(html).toContain('Carregando')
    expect(html).not.toContain('data-redirect')
    expect(mocks.toastError).not.toHaveBeenCalled()
  })
})
