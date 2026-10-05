import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { z } from 'zod'
import { writer } from '@/api/writer'
import { FormSchemaProvider } from '@/components/form-fields/form-schema'
import { LabeledInput } from '@/components/form-fields/labeled-input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
    <main className='flex min-h-svh items-center justify-center bg-background p-4 sm:p-8'>
      <Card
        aria-label='Acesso ao CarecaHub'
        className='grid w-full max-w-4xl gap-0 overflow-hidden rounded-xl border bg-card p-0 shadow-sm ring-0 md:h-[min(44rem,calc(100dvh-4rem))] md:grid-cols-[0.9fr_1.1fr]'
      >
        <div className='flex flex-col px-6 py-6 sm:px-8 md:py-6'>
          <div className='flex items-center gap-2.5'>
            <img src='/carecahub.png' alt='' className='size-9 object-contain' />
            <span className='text-lg font-semibold'>
              Careca<span className='text-highlight-soft-foreground'>Hub</span>
            </span>
          </div>
          <form
            className='my-auto w-full space-y-5 py-6 md:py-4'
            noValidate
            onSubmit={form.handleSubmit(submit)}
          >
            <div className='space-y-2'>
              <h1 className='text-2xl font-semibold tracking-tight'>Acesse seus projetos.</h1>
              <p className='text-sm text-muted-foreground'>Entre para acompanhar sua turma.</p>
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
                  className='h-10'
                  {...form.register('username')}
                  error={form.formState.errors.username?.message}
                />
                <LabeledInput
                  label='Senha'
                  showRequiredIndicator={false}
                  id='login-password'
                  type='password'
                  autoComplete='current-password'
                  className='h-10'
                  {...form.register('password')}
                  error={form.formState.errors.password?.message}
                />
                <FieldError errors={[form.formState.errors.root]} />
              </FieldGroup>
            </FormSchemaProvider>
            <Button
              variant='highlight'
              className='h-10 w-full'
              type='submit'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
            <div className='flex flex-wrap items-center justify-center gap-x-1 text-xs text-muted-foreground'>
              <span>Não possui uma conta?</span>
              <Button
                type='button'
                variant='link'
                className='h-auto p-0 text-xs font-bold hover:underline'
                aria-label='Cadastre-se'
              >
                Cadastre-se
              </Button>
            </div>
          </form>
        </div>
        <aside
          aria-label='Campus do Inatel'
          className='relative hidden overflow-hidden border-l bg-highlight-soft md:block'
        >
          <div className='relative z-10 space-y-3 px-8 pt-12 text-center lg:px-12'>
            <h2 className='text-xl font-medium text-foreground'>Projetos que começam aqui.</h2>
            <p className='text-xs text-foreground'>Inatel · Santa Rita do Sapucaí</p>
          </div>
          <img
            src='/inatel-campus-day.png'
            alt='Ilustração inspirada no prédio histórico do Inatel, com palmeiras e jardins.'
            className='absolute inset-0 h-full w-full object-cover dark:hidden'
          />
          <img
            src='/inatel-campus-night.png'
            alt=''
            aria-hidden='true'
            className='absolute inset-0 hidden h-full w-full object-cover dark:block'
          />
        </aside>
      </Card>
    </main>
  )
}
