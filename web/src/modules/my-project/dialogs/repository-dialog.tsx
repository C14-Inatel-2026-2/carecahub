import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { FormFieldLabel, FormSchemaProvider } from '@/components/form-fields/form-schema'
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
import { Field, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Group } from '@/types/group'
import type { Repository, RepositoryFormValues } from '@/types/repository'
import { repositoryFormSchema } from '@/types/repository'

export function RepositoryDialog({
  group,
  repository,
  onSaved,
}: {
  group: Group
  repository?: Repository
  onSaved: () => void
}) {
  const project = group.project
  const [open, setOpen] = useState(false)
  const form = useForm<RepositoryFormValues>({
    resolver: zodResolver(repositoryFormSchema),
    defaultValues: { url: repository?.url ?? '', ownerId: repository?.ownerId ?? '' },
  })

  if (!project) return null

  async function submit(values: RepositoryFormValues) {
    form.clearErrors('root')
    const projectId = group.project?.id
    if (!projectId) return
    const body = { ...values, url: values.url.trim(), projectId }
    const result = repository
      ? await writer('PATCH /repositories/:id', {
          silent: true,
          params: { id: repository.id },
          body,
        })
      : await writer('POST /repositories', {
          silent: true,
          body,
        })
    if (!result.ok) {
      form.setError('root', { message: result.error.message })
      return
    }
    toast.success(repository ? 'Repositório atualizado' : 'Repositório cadastrado')
    setOpen(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type='button' size='sm' variant={repository ? 'outline' : 'default'} />}
      >
        {repository ? <Pencil /> : <Plus />}
        {repository ? 'Editar' : 'Cadastrar repositório'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{repository ? 'Editar repositório' : 'Cadastrar repositório'}</DialogTitle>
          <DialogDescription>Informe o link do GitHub e o membro responsável.</DialogDescription>
        </DialogHeader>
        <FormSchemaProvider schema={repositoryFormSchema}>
          <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(submit)} className='grid gap-4'>
              <InputFF
                name='url'
                label='URL do GitHub'
                id='repository-url'
                placeholder='https://github.com/organizacao/repositorio'
              />
              <Controller
                control={form.control}
                name='ownerId'
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FormFieldLabel name='ownerId' htmlFor='repository-owner'>
                      Responsável
                    </FormFieldLabel>
                    <Select
                      value={field.value || null}
                      onValueChange={(value) => field.onChange(value ?? '')}
                    >
                      <SelectTrigger
                        id='repository-owner'
                        ref={field.ref}
                        onBlur={field.onBlur}
                        className='w-full'
                        aria-required='true'
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.invalid ? 'repository-owner-error' : undefined}
                      >
                        <SelectValue placeholder='Selecione um membro'>
                          {(value) => group.members.find((member) => member.id === value)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {group.members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError id='repository-owner-error' errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <FieldError errors={[form.formState.errors.root]} />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={form.formState.isSubmitting}>
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </FormSchemaProvider>
      </DialogContent>
    </Dialog>
  )
}
