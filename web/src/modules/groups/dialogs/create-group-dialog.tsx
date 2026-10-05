import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { FormSchemaProvider } from '@/components/form-fields/form-schema'
import { InputFF } from '@/components/form-fields/input-ff'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field'
import { type CreateGroupRequest, groupFormSchema } from '@/types/group'

export function CreateGroupDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const form = useForm<CreateGroupRequest>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { friendlyId: '' },
  })

  async function submit(values: CreateGroupRequest) {
    form.clearErrors('root')
    const result = await writer('POST /groups', { body: values, silent: true })
    if (!result.ok) {
      form.setError('root', { message: result.error.message })
      return
    }
    toast.success('Grupo criado')
    setOpen(false)
    form.reset()
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type='button' />}>
        <Plus /> Novo grupo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar grupo</DialogTitle>
          <DialogDescription>Você será definido como líder inicial do grupo.</DialogDescription>
        </DialogHeader>
        <FormSchemaProvider schema={groupFormSchema}>
          <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(submit)} className='grid gap-4'>
              <InputFF
                name='friendlyId'
                label='Nome do grupo'
                id='group-friendly-id'
                maxLength={30}
              />
              <FieldError errors={[form.formState.errors.root]} />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={form.formState.isSubmitting}>
                  Criar grupo
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </FormSchemaProvider>
      </DialogContent>
    </Dialog>
  )
}
