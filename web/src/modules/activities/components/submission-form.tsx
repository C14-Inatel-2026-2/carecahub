import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useList } from '@/api'
import { writer } from '@/api/writer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Activity } from '@/types/activity'

export function SubmissionForm({
  activity,
  onSubmitted,
}: {
  activity: Activity
  onSubmitted: () => void
}) {
  const [links, setLinks] = useState<string[]>([''])
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { data: repositories } = useList({
    endpoint: '/repositories',
    params: { skip: 0, take: 100 },
  })
  const needsFiles = activity.submissionType === 'files' || activity.submissionType === 'both'
  const needsLinks = activity.submissionType === 'links' || activity.submissionType === 'both'
  const closed = new Date() > new Date(activity.dueAt) && !activity.allowLateSubmissions

  async function submit() {
    if (closed) return toast.error('O prazo de entrega foi encerrado.')
    const additionalLinks = links.map((link) => link.trim()).filter(Boolean)
    if (
      (needsFiles && !files.length) ||
      (needsLinks && !selectedRepositories.length && !additionalLinks.length)
    ) {
      toast.error('Inclua todos os tipos de entrega exigidos pela atividade.')
      return
    }
    if (files.some((file) => file.type !== 'application/pdf')) {
      toast.error('Somente arquivos PDF podem ser enviados.')
      return
    }
    setSubmitting(true)
    const fileIds: string[] = []
    for (const file of files) {
      const body = new FormData()
      body.append('file', file)
      const uploaded = await writer('POST /files/private', { body, silent: true })
      if (!uploaded.ok) {
        toast.error(uploaded.error.message)
        setSubmitting(false)
        return
      }
      fileIds.push(uploaded.data.id)
    }
    const result = await writer('POST /activities/:id/submissions', {
      params: { id: activity.id },
      body: { fileIds, repositoryIds: selectedRepositories, additionalLinks },
      silent: true,
    })
    setSubmitting(false)
    if (!result.ok) return toast.error(result.error.message)
    toast.success(`Entrega versão ${result.data.version} registrada`)
    onSubmitted()
  }

  return (
    <section className='mt-6 max-w-3xl rounded-lg border bg-card p-5'>
      <h2 className='font-medium'>Enviar entrega</h2>
      <p className='mt-1 text-sm text-muted-foreground'>
        {closed
          ? 'Esta atividade não aceita entregas em atraso.'
          : new Date() > new Date(activity.dueAt)
            ? 'A atividade aceita somente a primeira entrega em atraso do grupo.'
            : `Prazo: ${new Date(activity.dueAt).toLocaleString('pt-BR')}`}
      </p>
      {needsLinks && (
        <div className='mt-4 grid gap-3'>
          <p className='text-sm font-medium'>Repositórios do projeto</p>
          {repositories.map((repository) => (
            <label key={repository.id} className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={selectedRepositories.includes(repository.id)}
                onChange={(event) =>
                  setSelectedRepositories((current) =>
                    event.target.checked
                      ? [...current, repository.id]
                      : current.filter((id) => id !== repository.id)
                  )
                }
              />
              {repository.url}
            </label>
          ))}
          <p className='pt-2 text-sm font-medium'>Links adicionais</p>
          {links.map((link, index) => (
            <div key={index} className='flex gap-2'>
              <Input
                value={link}
                placeholder='https://...'
                onChange={(event) =>
                  setLinks((current) =>
                    current.map((item, position) =>
                      position === index ? event.target.value : item
                    )
                  )
                }
              />
              {links.length > 1 && (
                <Button
                  size='icon-sm'
                  variant='ghost'
                  onClick={() =>
                    setLinks((current) => current.filter((_, position) => position !== index))
                  }
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
          <Button
            size='sm'
            variant='outline'
            onClick={() => setLinks((current) => [...current, ''])}
          >
            <Plus />
            Adicionar link
          </Button>
        </div>
      )}
      {needsFiles && (
        <label className='mt-4 grid gap-2 text-sm font-medium'>
          Arquivos PDF
          <input
            type='file'
            accept='application/pdf'
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 10))}
          />
          <span className='font-normal text-muted-foreground'>
            {files.map((file) => file.name).join(', ')}
          </span>
        </label>
      )}
      <Button className='mt-5' disabled={submitting || closed} onClick={() => void submit()}>
        {submitting ? 'Enviando…' : 'Enviar entrega'}
      </Button>
    </section>
  )
}
