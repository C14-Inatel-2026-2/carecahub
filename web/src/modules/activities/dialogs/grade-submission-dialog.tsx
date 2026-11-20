import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { FormSchemaProvider } from '@/components/form-fields/form-schema'
import { NumberFF, TextAreaFF } from '@/components/form-fields/input-ff'
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
import { type GradeFormValues, gradeFormSchema, type Submission } from '@/types/activity'

export function GradeSubmissionDialog({
  submission,
  groupName,
  onGraded,
}: {
  submission: Submission
  groupName: string
  onGraded: () => void
}) {
  const [open, setOpen] = useState(false)
  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      grade: submission.grade ?? undefined,
      feedback: submission.feedback ?? '',
    },
  })

  async function submit(values: GradeFormValues) {
    form.clearErrors('root')
    const result = await writer('PATCH /activities/submissions/:id/grade', {
      silent: true,
      params: { id: submission.id },
      body: { grade: values.grade, feedback: values.feedback?.trim() || undefined },
    })
    if (!result.ok) {
      form.setError('root', { message: result.error.friendlyMessage ?? result.error.message })
      return
    }
    toast.success('Nota publicada')
    setOpen(false)
    onGraded()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type='button' size='sm' variant='outline' />}>
        {submission.gradedAt ? 'Alterar nota' : 'Avaliar'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar entrega — {groupName}</DialogTitle>
          <DialogDescription>
            A nota e o comentário ficam visíveis só para o grupo e para os professores. Depois da
            nota, o grupo não consegue mais substituir a entrega.
          </DialogDescription>
        </DialogHeader>
        <FormSchemaProvider schema={gradeFormSchema}>
          <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(submit)} className='grid gap-4'>
              <NumberFF name='grade' label='Nota (0 a 10)' id='grade' min={0} max={10} step={0.1} />
              <TextAreaFF
                name='feedback'
                label='Comentário'
                id='feedback'
                rows={4}
                maxLength={2000}
              />
              <FieldError errors={[form.formState.errors.root]} />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button variant='highlight' type='submit' disabled={form.formState.isSubmitting}>
                  Publicar nota
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </FormSchemaProvider>
      </DialogContent>
    </Dialog>
  )
}
