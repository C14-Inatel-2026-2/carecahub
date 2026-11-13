import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink, Send } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { FormSchemaProvider } from '@/components/form-fields/form-schema'
import { InputFF } from '@/components/form-fields/input-ff'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import {
  type Activity,
  type Submission,
  type SubmissionFormValues,
  submissionFormSchema,
} from '@/types/activity'
import { canSubmit, formatDueDate, getActivityStatus } from '../activity-helpers'

export function StudentSubmissionCard({
  activity,
  submission,
  onSubmitted,
}: {
  activity: Activity
  submission?: Submission
  onSubmitted: () => void
}) {
  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: { url: submission?.url ?? '' },
  })
  const allowed = canSubmit(activity, submission)
  const status = getActivityStatus(activity)

  async function submit(values: SubmissionFormValues) {
    form.clearErrors('root')
    const result = await writer('POST /activities/:id/submissions', {
      silent: true,
      params: { id: activity.id },
      body: { url: values.url.trim() },
    })
    if (!result.ok) {
      form.setError('root', { message: result.error.friendlyMessage ?? result.error.message })
      return
    }
    toast.success(submission ? 'Entrega atualizada' : 'Entrega enviada')
    onSubmitted()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrega do seu grupo</CardTitle>
        <CardDescription>
          Uma entrega por grupo. Qualquer membro pode enviar ou substituir até o professor dar a
          nota.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {submission ? (
          <div className='grid gap-1 rounded-lg border p-3 text-sm'>
            <a
              href={submission.url}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1 font-medium break-all underline-offset-4 hover:underline'
            >
              {submission.url}
              <ExternalLink className='size-3.5 shrink-0' />
            </a>
            <span className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
              Enviada em {formatDueDate(submission.submittedAt)}
              {submission.isLate && <Badge variant='destructive'>Atrasada</Badge>}
            </span>
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>
            Seu grupo ainda não enviou esta atividade.
          </p>
        )}

        {submission?.gradedAt && (
          <div className='grid gap-1 rounded-lg bg-muted/50 p-3'>
            <span className='text-sm'>
              Nota: <strong className='text-base'>{submission.grade}</strong>
            </span>
            {submission.feedback && (
              <p className='text-sm whitespace-pre-wrap text-muted-foreground'>
                {submission.feedback}
              </p>
            )}
          </div>
        )}

        {allowed ? (
          <FormSchemaProvider schema={submissionFormSchema}>
            <FormProvider {...form}>
              <form noValidate onSubmit={form.handleSubmit(submit)} className='grid gap-3'>
                {status === 'late' && (
                  <p className='text-xs text-muted-foreground'>
                    O prazo já passou. O professor aceita atrasos, mas a entrega ficará marcada como
                    atrasada.
                  </p>
                )}
                <InputFF
                  name='url'
                  label='Link da entrega'
                  id='submission-url'
                  placeholder='https://github.com/organizacao/repositorio'
                />
                <FieldError errors={[form.formState.errors.root]} />
                <Button
                  type='submit'
                  variant='highlight'
                  className='w-fit'
                  disabled={form.formState.isSubmitting}
                >
                  <Send />
                  {submission ? 'Substituir entrega' : 'Enviar entrega'}
                </Button>
              </form>
            </FormProvider>
          </FormSchemaProvider>
        ) : (
          <p className='text-xs text-muted-foreground'>
            {submission?.gradedAt
              ? 'A entrega já foi avaliada e não pode mais ser substituída.'
              : 'O prazo terminou e esta atividade não aceita entregas atrasadas.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
