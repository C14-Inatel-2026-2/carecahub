import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { z } from 'zod'
import { writer } from '@/api/writer'
import { FormSchemaProvider } from '@/components/form-fields/form-schema'
import { LabeledInput } from '@/components/form-fields/labeled-input'
import { Button } from '@/components/ui/button'
import { FieldError, FieldGroup } from '@/components/ui/field'
import { loginMockUser } from '@/mocks/auth'
import { isMockAPIEnabled } from '@/mocks/config'
import { appRoutes } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import { loginSchema } from '@/types/auth'

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setUser = useUser((state) => state.setUser)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  async function submit(values: LoginFormValues) {
    form.clearErrors('root')
    if (isMockAPIEnabled) {
      try {
        setUser(loginMockUser(localStorage, values))
        navigateAfterLogin()
      } catch (error) {
        form.setError('root', {
          message: error instanceof Error ? error.message : 'Não foi possível entrar.',
        })
      }
      return
    }

    const result = await writer('POST /auth/login', {
      body: values,
      silent: true,
    })
    if (!result.ok) {
      form.setError('root', {
        message: result.error.friendlyMessage ?? result.error.message,
      })
      return
    }

    setUser(result.data.user)
    navigateAfterLogin()
  }

  function navigateAfterLogin() {
    const requestedPath = searchParams.get('next')
    const next =
      requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : appRoutes.home
    navigate(next, { replace: true })
  }

  return (
    <main className='grid min-h-svh place-items-center bg-muted/30 p-6'>
      <form
        className='w-full max-w-sm space-y-5 rounded-xl border bg-card p-6 shadow-sm'
        noValidate
        onSubmit={form.handleSubmit(submit)}
      >
        <div>
          <h1 className='text-xl font-semibold'>CarecaHub</h1>
          <p className='mt-1 text-sm text-muted-foreground'>Acesse seus projetos.</p>
        </div>
        <FormSchemaProvider schema={loginSchema}>
          <FieldGroup>
            <LabeledInput
              label='E-mail'
              showRequiredIndicator={false}
              id='login-email'
              type='email'
              autoComplete='email'
              autoFocus
              {...form.register('username')}
              error={form.formState.errors.username?.message}
            />
            <LabeledInput
              label='Senha'
              showRequiredIndicator={false}
              id='login-password'
              type='password'
              autoComplete='current-password'
              {...form.register('password')}
              error={form.formState.errors.password?.message}
            />
            <FieldError errors={[form.formState.errors.root]} />
          </FieldGroup>
        </FormSchemaProvider>
        <Button className='w-full' type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  )
}
