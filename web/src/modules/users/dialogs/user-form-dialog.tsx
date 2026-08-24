import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { InputFF } from '@/components/form-fields/input-ff'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError, FieldGroup } from '@/components/ui/field'
import type { User } from '@/types/user'
import { userFormSchema } from '@/types/user'

export type UserFormValues = z.infer<typeof userFormSchema>

export function UserFormDialog({
  title,
  description,
  submitLabel,
  user,
  onSubmit,
}: {
  title: string
  description: string
  submitLabel: string
  user?: User
  onSubmit: (values: UserFormValues) => Promise<string | undefined>
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', password: '' },
  })

  useEffect(() => {
    form.reset({ name: user?.name ?? '', email: user?.email ?? '', password: '' })
  }, [user, form.reset])

  async function submit(values: UserFormValues) {
    form.clearErrors('root')
    const error = await onSubmit(values)
    if (error) form.setError('root', { message: error })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <FormProvider {...form}>
        <form className='grid gap-4' noValidate onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <InputFF name='name' label='Nome' />
            <InputFF name='email' label='E-mail' type='email' />
            {!user && <InputFF name='password' label='Senha' type='password' />}
            <FieldError errors={[form.formState.errors.root]} />
          </FieldGroup>
          <DialogFooter>
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </FormProvider>
    </DialogContent>
  )
}
