import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { InputFF, TextAreaFF } from '@/components/form-fields/input-ff'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError, FieldGroup } from '@/components/ui/field'
import { createPostSchema } from '@/types/post'

type PostFormValues = z.infer<typeof createPostSchema>
const emptyPost: PostFormValues = { title: '', content: '' }

type PostFormDialogProps = {
  title: string
  description: string
  submitLabel: string
  defaultValues?: PostFormValues
  onSubmit: (values: PostFormValues) => Promise<string | undefined>
}

export function PostFormDialog({
  title,
  description,
  submitLabel,
  defaultValues = emptyPost,
  onSubmit,
}: PostFormDialogProps) {
  const form = useForm<PostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form.reset])

  async function submit(values: PostFormValues) {
    form.clearErrors('root')
    const error = await onSubmit(values)
    if (error) {
      form.setError('root', { message: error })
      return
    }
    form.reset(defaultValues)
  }

  return (
    <DialogContent className='sm:max-w-2xl'>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <FormProvider {...form}>
        <form className='grid gap-4' noValidate onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <InputFF name='title' label='Título' />
            <TextAreaFF name='content' label='Conteúdo' rows={10} />
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
