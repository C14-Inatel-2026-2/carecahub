import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MentorFormDialog } from '../src/modules/mentors/dialogs/mentor-form-dialog'
import { UserFormDialog, type UserFormValues } from '../src/modules/users/dialogs/user-form-dialog'
import type { User } from '../src/types/user'

const mocks = vi.hoisted(() => ({
  reset: vi.fn(),
  clearErrors: vi.fn(),
  setError: vi.fn(),
  submit: undefined as ((values: UserFormValues) => Promise<void>) | undefined,
}))

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    reset: mocks.reset,
    clearErrors: mocks.clearErrors,
    setError: mocks.setError,
    formState: { errors: {}, isSubmitting: false },
    handleSubmit: (submit: (values: UserFormValues) => Promise<void>) => {
      mocks.submit = submit
      return () => undefined
    },
  }),
  useWatch: () => 'student',
  FormProvider: ({ children }: { children: ReactNode }) => children,
  Controller: () => null,
}))

vi.mock('@/components/form-fields/input-ff', () => ({
  InputFF: () => null,
  NumberFF: () => null,
}))

vi.mock('@/components/ui/dialog', () => {
  const Content = ({ children }: { children: ReactNode }) => <div>{children}</div>
  return {
    DialogContent: Content,
    DialogHeader: Content,
    DialogTitle: Content,
    DialogDescription: Content,
    DialogFooter: Content,
  }
})

const values: UserFormValues = {
  name: 'Usuário de teste',
  email: 'teste@example.com',
  registration: 123,
  password: 'Teste@123',
  role: 'student',
}

beforeEach(() => {
  mocks.reset.mockClear()
  mocks.setError.mockClear()
  mocks.clearErrors.mockClear()
  mocks.submit = undefined
})

describe.each([
  ['user', UserFormDialog],
  ['mentor', MentorFormDialog],
] as const)('%s form reset', (_name, Form) => {
  it('clears creation fields after a successful save', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderToStaticMarkup(
      <Form title='Criar' description='Criar conta' requesterRole='admin' onSubmit={onSubmit} />
    )
    await mocks.submit!(values)
    expect(onSubmit).toHaveBeenCalledWith(values)
    expect(mocks.reset).toHaveBeenCalledOnce()
    expect(mocks.reset).toHaveBeenCalledWith()
  })

  it('preserves creation fields and presents the error when saving fails', async () => {
    renderToStaticMarkup(
      <Form
        title='Criar'
        description='Criar conta'
        requesterRole='admin'
        onSubmit={async () => 'Já existe um registro com esses dados.'}
      />
    )
    await mocks.submit!(values)
    expect(mocks.reset).not.toHaveBeenCalled()
    expect(mocks.setError).toHaveBeenCalledWith('root', {
      message: 'Já existe um registro com esses dados.',
    })
  })

  it('does not blank an existing user after editing', async () => {
    const user = { ...values, id: 'user-1' } as User
    renderToStaticMarkup(
      <Form
        title='Editar'
        description='Editar conta'
        requesterRole='admin'
        user={user}
        onSubmit={async () => undefined}
      />
    )
    await mocks.submit!(values)
    expect(mocks.reset).not.toHaveBeenCalled()
  })
})
