import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../src/modules/auth/login-page'
import { loginSchema } from '../src/types/auth'

const mocks = vi.hoisted(() => ({
  writer: vi.fn(),
  navigate: vi.fn(),
  setUser: vi.fn(),
  setError: vi.fn(),
  next: '',
  pending: false,
  submit: undefined as
    | undefined
    | ((values: { username: string; password: string }) => Promise<void>),
}))

vi.mock('@/api/writer', () => ({ writer: mocks.writer }))
vi.mock('@/mocks/config', () => ({ isMockAPIEnabled: false }))
vi.mock('@/stores/use-user', () => ({
  useUser: (selector: (state: { setUser: typeof mocks.setUser }) => unknown) =>
    selector({ setUser: mocks.setUser }),
}))
vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams({ next: mocks.next })],
}))
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: (name: string) => ({ name }),
    clearErrors: vi.fn(),
    setError: mocks.setError,
    formState: { errors: {}, isSubmitting: mocks.pending },
    handleSubmit: (submit: NonNullable<typeof mocks.submit>) => {
      mocks.submit = submit
      return () => undefined
    },
  }),
}))

const values = { username: 'aluno@example.com', password: 'Senha123!' }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.next = ''
  mocks.pending = false
})

describe('login validation', () => {
  it('accepts the existing valid credentials contract without mocks', () => {
    expect(loginSchema.parse(values)).toEqual(values)
  })

  it('rejects invalid email and short password without mocks', () => {
    const result = loginSchema.safeParse({ username: 'invalido', password: '123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(['username', 'password'])
    }
  })
})

describe('LoginPage', () => {
  it('stores the authenticated user and follows a local destination', async () => {
    const user = { id: '1', name: 'Aluno', role: 'student' }
    mocks.next = '/groups'
    mocks.writer.mockResolvedValue({ ok: true, data: { user } })
    renderToStaticMarkup(<LoginPage />)
    await mocks.submit!(values)
    expect(mocks.writer).toHaveBeenCalledWith('POST /auth/login', { body: values, silent: true })
    expect(mocks.setUser).toHaveBeenCalledWith(user)
    expect(mocks.navigate).toHaveBeenCalledWith('/groups', { replace: true })
  })

  it('keeps the user on login and associates a friendly API error with the form', async () => {
    mocks.writer.mockResolvedValue({
      ok: false,
      error: { message: 'technical', friendlyMessage: 'E-mail ou senha incorretos.' },
    })
    renderToStaticMarkup(<LoginPage />)
    await mocks.submit!(values)
    expect(mocks.setError).toHaveBeenCalledWith('root', { message: 'E-mail ou senha incorretos.' })
    expect(mocks.setUser).not.toHaveBeenCalled()
    expect(mocks.navigate).not.toHaveBeenCalled()
  })

  it('rejects an external redirect after successful authentication', async () => {
    mocks.next = '//example.com'
    mocks.writer.mockResolvedValue({ ok: true, data: { user: { id: '1' } } })
    renderToStaticMarkup(<LoginPage />)
    await mocks.submit!(values)
    expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('disables submitting while pending and keeps login required indicators hidden', () => {
    mocks.pending = true
    const html = renderToStaticMarkup(<LoginPage />)
    expect(html).toContain('Entrando…')
    expect(html).toContain('disabled=""')
    expect(html).not.toContain('(obrigatório)')
    expect(html).toMatch(/autocomplete="current-password"/i)
  })
})
