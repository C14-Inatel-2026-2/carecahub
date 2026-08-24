import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { z } from 'zod'
import { writer } from '@/api/writer'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
    const result = await writer('POST /auth/login', { body: values, silent: true })
    if (!result.ok) {
      form.setError('root', { message: result.error.friendlyMessage ?? result.error.message })
      return
    }

    setUser(result.data.user)
    const requestedPath = searchParams.get('next')
    const next =
      requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : appRoutes.posts
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
          <h1 className='text-xl font-semibold'>Ignite</h1>
          <p className='mt-1 text-sm text-muted-foreground'>Acesse seus projetos.</p>
        </div>
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.username}>
            <FieldLabel htmlFor='login-email'>E-mail</FieldLabel>
            <Input
              id='login-email'
              type='email'
              autoComplete='email'
              autoFocus
              aria-invalid={!!form.formState.errors.username}
              {...form.register('username')}
            />
            <FieldError errors={[form.formState.errors.username]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.password}>
            <FieldLabel htmlFor='login-password'>Senha</FieldLabel>
            <Input
              id='login-password'
              type='password'
              autoComplete='current-password'
              aria-invalid={!!form.formState.errors.password}
              {...form.register('password')}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
          <FieldError errors={[form.formState.errors.root]} />
        </FieldGroup>
        <Button className='w-full' type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  )
}
