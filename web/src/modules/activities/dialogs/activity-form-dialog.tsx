import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { FormSchemaProvider } from '@/components/form-fields/form-schema'
import { InputFF } from '@/components/form-fields/input-ff'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Activity, type ActivityFormRequest, activityFormSchema } from '@/types/activity'
import { ActivityRichTextEditor } from '../components/activity-rich-text'

export function ActivityFormDialog({
  activity,
  onSaved,
}: {
  activity?: Activity
  onSaved: () => void
}) {
  const [referenceFiles, setReferenceFiles] = useState<File[]>([])
  const form = useForm<ActivityFormRequest>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: activity
      ? {
          title: activity.title,
          description: activity.description,
          dueAt: activity.dueAt.slice(0, 16),
          allowLateSubmissions: activity.allowLateSubmissions,
          submissionType: activity.submissionType,
          attachmentIds: [],
        }
      : {
          title: '',
          description: '',
          dueAt: '',
          allowLateSubmissions: false,
          submissionType: 'both',
          attachmentIds: [],
        },
  })
  async function submit(values: ActivityFormRequest) {
    if (referenceFiles.length > 10) {
      form.setError('root', { message: 'Envie no máximo 10 arquivos de referência.' })
      return
    }
    const attachmentIds: string[] = []
    for (const file of referenceFiles) {
      const upload = new FormData()
      upload.append('file', file)
      const result = await writer('POST /files/private', { body: upload, silent: true })
      if (!result.ok) return form.setError('root', { message: result.error.message })
      attachmentIds.push(result.data.id)
    }
    const body = {
      ...values,
      dueAt: new Date(values.dueAt).toISOString(),
    }
    const result = activity
      ? await writer('PATCH /activities/:id', {
          params: { id: activity.id },
          body: referenceFiles.length
            ? { ...body, attachmentIds }
            : { ...body, attachmentIds: undefined },
        })
      : await writer('POST /activities', { body: { ...body, attachmentIds } })
    if (!result.ok) return form.setError('root', { message: result.error.message })
    toast.success(activity ? 'Atividade atualizada' : 'Atividade publicada')
    onSaved()
  }
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{activity ? 'Editar atividade' : 'Nova atividade'}</DialogTitle>
        <DialogDescription>Defina as orientações e o prazo para os grupos.</DialogDescription>
      </DialogHeader>
      <FormSchemaProvider schema={activityFormSchema}>
        <FormProvider {...form}>
          <form className='grid gap-4' noValidate onSubmit={form.handleSubmit(submit)}>
            <InputFF name='title' label='Título' />
            <Controller
              name='description'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Descrição</FieldLabel>
                  <div className='overflow-hidden rounded-lg border'>
                    <ActivityRichTextEditor value={field.value} onChange={field.onChange} />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <InputFF name='dueAt' label='Prazo de entrega' type='datetime-local' />
            <Field>
              <FieldLabel>Tipo de entrega</FieldLabel>
              <Select
                value={form.watch('submissionType')}
                onValueChange={(value) =>
                  form.setValue('submissionType', value as ActivityFormRequest['submissionType'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='links'>Links</SelectItem>
                  <SelectItem value='files'>Arquivos</SelectItem>
                  <SelectItem value='both'>Links e arquivos</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.watch('allowLateSubmissions')}
                onChange={(event) => form.setValue('allowLateSubmissions', event.target.checked)}
              />{' '}
              Aceitar primeira entrega após o prazo
            </label>
            <Field>
              <FieldLabel>Anexos de referência</FieldLabel>
              <input
                type='file'
                multiple
                onChange={(event) =>
                  setReferenceFiles(Array.from(event.target.files ?? []).slice(0, 10))
                }
              />
              <p className='text-xs text-muted-foreground'>
                Até 10 arquivos para orientar os grupos.
              </p>
              {referenceFiles.length > 0 && (
                <p className='text-xs text-muted-foreground'>
                  {referenceFiles.map((file) => file.name).join(', ')}
                </p>
              )}
            </Field>
            <FieldError errors={[form.formState.errors.root]} />
            <DialogFooter>
              <Button type='submit' variant='highlight' disabled={form.formState.isSubmitting}>
                {activity ? 'Salvar' : 'Publicar atividade'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </FormSchemaProvider>
    </DialogContent>
  )
}
