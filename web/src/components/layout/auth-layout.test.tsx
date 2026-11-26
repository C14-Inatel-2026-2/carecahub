import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthLayout, shouldShowScrollFade } from './auth-layout'

vi.mock('./app-sidebar', () => ({
  AppSidebar: () => <aside data-slot='app-sidebar' />,
}))

vi.mock('@/api', () => ({
  useList: () => ({ unreadCount: 2 }),
  useGet: () => ({
    data: {
      gitHubDetails: { avatarUrl: 'https://avatars.githubusercontent.com/u/1' },
    },
  }),
}))

vi.mock('@/stores/use-user', () => ({
  useUser: () => ({
    user: { id: 'student-1', name: 'Ana', email: 'ana@example.com', role: 'student' },
    isLoading: false,
    loadUser: async () => undefined,
  }),
}))

describe('AuthLayout', () => {
  it('shows the scroll fade only while more content is available below', () => {
    expect(shouldShowScrollFade({ clientHeight: 400, scrollHeight: 800, scrollTop: 0 })).toBe(true)
    expect(shouldShowScrollFade({ clientHeight: 400, scrollHeight: 800, scrollTop: 400 })).toBe(
      false
    )
    expect(shouldShowScrollFade({ clientHeight: 400, scrollHeight: 400, scrollTop: 0 })).toBe(false)
  })

  it('wraps every authenticated route in a sidebar-styled content panel', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route index element={<p>Página interna</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(html).toContain('data-slot="app-content-panel"')
    expect(html).toContain('bg-sidebar')
    expect(html).toContain('ring-sidebar-border')
    expect(html).toContain('h-svh')
    expect(html).toContain('overflow-y-auto')
    expect(html).toContain('data-slot="mobile-navigation-header"')
    expect(html).toContain('aria-label="Abrir menu"')
    expect(html).toContain('aria-label="Ver notificações"')
    expect(html).toContain('aria-label="Abrir menu da conta"')
    expect(html).toContain('2 notificações não lidas')
    expect(html).toContain('href="/notifications"')
    expect(html).toContain('src="https://avatars.githubusercontent.com/u/1"')
    expect(html).toContain('alt="Ana"')
    expect(html).toContain('Página interna')
  })
})
