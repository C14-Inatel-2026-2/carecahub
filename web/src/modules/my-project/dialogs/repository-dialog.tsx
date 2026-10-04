import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { writer } from '@/api/writer'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Group } from '@/types/group'
import type { Repository } from '@/types/repository'
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
  const [url, setUrl] = useState(repository?.url ?? '')
  const [ownerId, setOwnerId] = useState(repository?.ownerId ?? '')
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!project) return null

  async function submit() {
    const projectId = group.project?.id
    if (!projectId) return
    const parsed = repositoryFormSchema.safeParse({ url: url.trim(), ownerId })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message)
      return
    }
    setIsSubmitting(true)
    const body = { ...parsed.data, projectId }
    const result = repository
      ? await writer('PATCH /repositories/:id', {
          params: { id: repository.id },
          body,
          onSuccessMessage: 'Repositório atualizado',
        })
      : await writer('POST /repositories', {
          body,
          onSuccessMessage: 'Repositório cadastrado',
        })
    setIsSubmitting(false)
    if (!result.ok) return
    setOpen(false)
    setError(undefined)
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
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='repository-url'>URL do GitHub</Label>
            <Input
              id='repository-url'
              value={url}
              placeholder='https://github.com/organizacao/repositorio'
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='repository-owner'>Responsável</Label>
            <Select value={ownerId || null} onValueChange={(value) => setOwnerId(value ?? '')}>
              <SelectTrigger id='repository-owner' className='w-full'>
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
          </div>
          {error && <p className='text-sm text-destructive'>{error}</p>}
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type='button' disabled={isSubmitting} onClick={submit}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
