import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'
import { FormFieldLabel, FormSchemaProvider } from '@/components/form-fields/form-schema'
import { InputFF, NumberFF } from '@/components/form-fields/input-ff'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User, UserRole } from '@/types/user'
import {
  academicFieldsByRole,
  createUserSchema,
  formatUserRole,
  isRegistrationRequired,
  manageableRolesByRole,
  updateUserSchema,
  userFormSchema,
  userRoleLabels,
} from '@/types/user'

type UserFormInput = z.input<typeof userFormSchema>
export type UserFormValues = z.output<typeof userFormSchema>

export function UserFormDialog({
  title,
  description,
  submitLabel = 'Criar usuário',
  requesterRole,
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
  const availableRoles = manageableRolesByRole[requesterRole]
  const defaultRole = user?.role ?? availableRoles.at(-1)
  const form = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(user ? userFormSchema : createUserSchema),
    defaultValues: {
      name: user?.name ?? '',
      registration: user?.registration ?? undefined,
      githubName: user?.githubName ?? '',
      classroom: user?.classroom ?? '',
      email: user?.email ?? '',
      password: '',
      role: defaultRole,
    },
  })
  const selectedRole = useWatch({ control: form.control, name: 'role' }) ?? defaultRole
  const academicFields = selectedRole ? academicFieldsByRole[selectedRole] : []

  useEffect(() => {
    form.reset({
      name: user?.name ?? '',
      registration: user?.registration ?? undefined,
      githubName: user?.githubName ?? '',
      classroom: user?.classroom ?? '',
      email: user?.email ?? '',
      password: '',
      role: defaultRole,
    })
  }, [user, defaultRole, form.reset])

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
      <FormSchemaProvider schema={user ? updateUserSchema : createUserSchema}>
        <FormProvider {...form}>
          <form className='grid gap-4' noValidate onSubmit={form.handleSubmit(submit)}>
            <FieldGroup>
              <InputFF name='name' label='Nome' />
              {academicFields.includes('registration') && (
                <NumberFF
                  name='registration'
                  label='Matrícula'
                  min={1}
                  required={isRegistrationRequired(selectedRole)}
                />
              )}
              {academicFields.includes('githubName') && (
                <InputFF name='githubName' label='Usuário do GitHub' />
              )}
              {academicFields.includes('classroom') && (
                <InputFF name='classroom' label='Turma' maxLength={2} />
              )}
              <InputFF name='email' label='E-mail' type='email' />
              {availableRoles.length > 1 && (
                <Controller
                  control={form.control}
                  name='role'
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FormFieldLabel name='role' htmlFor='user-role'>
                        Função
                      </FormFieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id='user-role'
                          ref={field.ref}
                          onBlur={field.onBlur}
                          className='w-full'
                          aria-invalid={fieldState.invalid}
                          aria-required='true'
                          aria-describedby={fieldState.invalid ? 'user-role-error' : undefined}
                        >
                          <SelectValue>
                            {(role) => formatUserRole(role as UserRole | null)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {userRoleLabels[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError id='user-role-error' errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              )}
              {!user && <InputFF name='password' label='Senha' type='password' />}
              <FieldError errors={[form.formState.errors.root]} />
            </FieldGroup>
            <DialogFooter>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {!form.formState.isSubmitting
                  ? user
                    ? submitLabel
                    : `Criar ${formatUserRole(selectedRole)}`
                  : user
                    ? 'Salvando...'
                    : 'Criando...'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </FormSchemaProvider>
    </DialogContent>
  )
}
