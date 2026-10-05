import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { writer } from '@/api/writer'
import { FormSchemaProvider } from '@/components/form-fields/form-schema'
import { InputFF } from '@/components/form-fields/input-ff'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError, FieldGroup } from '@/components/ui/field'
import { passwordChangeSchema } from '@/types/auth'

type PasswordFormValues = z.infer<typeof passwordChangeSchema>

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { oldPassword: '', newPassword: '' },
  })

  async function submit(values: PasswordFormValues) {
    form.clearErrors('root')
    const result = await writer('POST /auth/change-password', { body: values, silent: true })
    if (!result.ok) {
      form.setError('root', { message: result.error.friendlyMessage ?? result.error.message })
      return
    }

    toast.success('Senha alterada')
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
        </DialogHeader>
        <FormSchemaProvider schema={passwordChangeSchema}>
          <FormProvider {...form}>
            <form className='grid gap-4' noValidate onSubmit={form.handleSubmit(submit)}>
              <FieldGroup>
                <InputFF name='oldPassword' label='Senha atual' type='password' className='h-10' />
                <InputFF name='newPassword' label='Nova senha' type='password' className='h-10' />
                <FieldError errors={[form.formState.errors.root]} />
              </FieldGroup>
              <DialogFooter>
                <Button variant='highlight' type='submit' disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Salvando…' : 'Alterar senha'}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </FormSchemaProvider>
      </DialogContent>
    </Dialog>
  )
}
