import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { FormSchemaProvider } from '@/components/form-fields/form-schema'
import { InputFF, NumberFF } from '@/components/form-fields/input-ff'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError, FieldGroup } from '@/components/ui/field'
import type { User, UserRole } from '@/types/user'
import {
  createUserSchema,
  isRegistrationRequired,
  updateUserSchema,
  userFormSchema,
} from '@/types/user'

type UserFormInput = z.input<typeof userFormSchema>
export type UserFormValues = z.output<typeof userFormSchema>

export function MentorFormDialog({
  title,
  description,
  user,
  onSubmit,
}: {
  title: string
  description: string
  submitLabel?: string
  requesterRole: UserRole
  user?: User
  onSubmit: (values: UserFormValues) => Promise<string | undefined>
}) {
  const form = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(user ? userFormSchema : createUserSchema),
    defaultValues: {
      name: user?.name ?? '',
      registration: user?.registration ?? undefined,
      githubName: user?.githubName ?? '',
      classroom: user?.classroom ?? '',
      email: user?.email ?? '',
      password: '',
      role: 'mentor',
    },
  })
  useEffect(() => {
    form.reset({
      name: user?.name ?? '',
      registration: user?.registration ?? undefined,
      githubName: user?.githubName ?? '',
      classroom: user?.classroom ?? '',
      email: user?.email ?? '',
      password: '',
      role: 'mentor',
    })
  }, [user, form.reset])

  async function submit(values: UserFormValues) {
    form.clearErrors('root')
    const error = await onSubmit(values)
    if (error) {
      form.setError('root', { message: error })
      return
    }
    if (!user) form.reset()
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <FormSchemaProvider schema={user ? updateUserSchema : createUserSchema}>
        <FormProvider {...form}>
          <form className='grid gap-4' noValidate onSubmit={form.handleSubmit(submit)}>
            <FieldGroup>
              <InputFF name='name' label='Nome' />
              <NumberFF
                name='registration'
                label='Matrícula'
                min={1}
                required={isRegistrationRequired('mentor')}
              />
              <InputFF name='githubName' label='Usuário do GitHub' />
              <InputFF name='email' label='E-mail' type='email' />
              {!user && <InputFF name='password' label='Senha' type='password' />}
              <FieldError errors={[form.formState.errors.root]} />
            </FieldGroup>
            <DialogFooter>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {!form.formState.isSubmitting ? 'Criar monitor' : 'Criando...'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </FormSchemaProvider>
    </DialogContent>
  )
}
