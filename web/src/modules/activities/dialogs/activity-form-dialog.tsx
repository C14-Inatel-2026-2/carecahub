import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { FormSchemaProvider } from '@/components/form-fields/form-schema'
import { InputFF, TextAreaFF } from '@/components/form-fields/input-ff'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { type Activity, type ActivityFormValues, activityFormSchema } from '@/types/activity'
import { toDateTimeLocal } from '../activity-helpers'

export function ActivityFormDialog({
  activity,
  onSaved,
}: {
  activity?: Activity
  onSaved: (activity: Activity) => void
}) {
  const [open, setOpen] = useState(false)
  const defaultValues: ActivityFormValues = {
    title: activity?.title ?? '',
    description: activity?.description ?? '',
    dueDate: activity ? toDateTimeLocal(activity.dueDate) : '',
    allowLateSubmissions: activity?.allowLateSubmissions ?? false,
  }
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues,
  })

  function handleOpenChange(next: boolean) {
    if (next) form.reset(defaultValues)
    setOpen(next)
  }

  async function submit(values: ActivityFormValues) {
    form.clearErrors('root')
    const dueDate = new Date(values.dueDate)
    const dueDateChanged = !activity || dueDate.getTime() !== new Date(activity.dueDate).getTime()

    // Same rule as the API: a new deadline must be in the future.
    if (dueDateChanged && dueDate.getTime() <= Date.now()) {
      form.setError('dueDate', { message: 'O prazo precisa ser uma data futura.' })
      return
    }

    const body = {
      title: values.title.trim(),
      description: values.description.trim(),
      dueDate: dueDate.toISOString(),
      allowLateSubmissions: values.allowLateSubmissions,
    }
    const result = activity
      ? await writer('PATCH /activities/:id', { silent: true, params: { id: activity.id }, body })
      : await writer('POST /activities', { silent: true, body })

    if (!result.ok) {
      form.setError('root', { message: result.error.friendlyMessage ?? result.error.message })
      return
    }
    toast.success(activity ? 'Atividade atualizada' : 'Atividade publicada')
    setOpen(false)
    onSaved(result.data)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button type='button' size='sm' variant={activity ? 'outline' : 'highlight'} />}
      >
        {activity ? <Pencil /> : <Plus />}
        {activity ? 'Editar' : 'Nova atividade'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{activity ? 'Editar atividade' : 'Nova atividade'}</DialogTitle>
          <DialogDescription>
            Os alunos veem sempre a versão mais recente das instruções e do prazo.
          </DialogDescription>
        </DialogHeader>
        <FormSchemaProvider schema={activityFormSchema}>
          <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(submit)} className='grid gap-4'>
              <InputFF name='title' label='Título' id='activity-title' maxLength={255} />
              <TextAreaFF
                name='description'
                label='Instruções'
                id='activity-description'
                rows={5}
              />
              <InputFF name='dueDate' label='Prazo' id='activity-due-date' type='datetime-local' />
              <Controller
                control={form.control}
                name='allowLateSubmissions'
                render={({ field }) => (
                  <label className='flex items-center gap-2 text-sm' htmlFor='activity-allow-late'>
                    <Checkbox
                      id='activity-allow-late'
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                    Aceitar entregas depois do prazo (ficam marcadas como atrasadas)
                  </label>
                )}
              />
              <FieldError errors={[form.formState.errors.root]} />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button variant='highlight' type='submit' disabled={form.formState.isSubmitting}>
                  {activity ? 'Salvar' : 'Publicar'}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </FormSchemaProvider>
      </DialogContent>
    </Dialog>
  )
}
