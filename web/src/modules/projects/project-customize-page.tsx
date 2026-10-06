import { ArrowLeft, Box, ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useGet } from '@/api'
import { writer } from '@/api/writer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { projectDetailsRoute } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import {
  type Project,
  projectAppearanceSchema,
  type UpdateProjectAppearanceRequest,
} from '@/types/project'

function useFilePreview(file: File | null, savedUrl?: string | null) {
  const [preview, setPreview] = useState(savedUrl ?? '')

  useEffect(() => {
    if (!file) {
      setPreview(savedUrl ?? '')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, savedUrl])

  return preview
}

export function ProjectCustomizeContent({
  project,
  onSaved,
}: {
  project: Project
  onSaved: (updated: Project) => void
}) {
  const [color, setColor] = useState(project.mainColor ?? '#2563EB')
  const [colorChanged, setColorChanged] = useState(false)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const iconPreview = useFilePreview(iconFile, project.iconUrl)
  const thumbnailPreview = useFilePreview(thumbnailFile, project.thumbnailUrl)

  async function uploadImage(file: File): Promise<string | null> {
    if (
      !['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'].includes(file.type)
    ) {
      setError('Selecione uma imagem PNG, JPEG, WebP, GIF ou SVG.')
      return null
    }
    if (file.size > 10_000_000) {
      setError('Selecione uma imagem de até 10 MB.')
      return null
    }
    const body = new FormData()
    body.append('file', file)
    const result = await writer('POST /files/public', { body, silent: true })
    if (!result.ok || !result.data.url) {
      setError(result.ok ? 'O upload não retornou uma URL.' : result.error.message)
      return null
    }
    return result.data.url
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (colorChanged && !projectAppearanceSchema.safeParse({ mainColor: color }).success) {
      setError('Informe uma cor HEX válida, por exemplo #2563EB.')
      return
    }

    setSaving(true)
    try {
      const body: UpdateProjectAppearanceRequest = {}
      if (colorChanged) body.mainColor = color.toUpperCase()
      if (iconFile) {
        const url = await uploadImage(iconFile)
        if (!url) return
        body.iconUrl = url
      }
      if (thumbnailFile) {
        const url = await uploadImage(thumbnailFile)
        if (!url) return
        body.thumbnailUrl = url
      }

      const result = await writer('PATCH /projects/:id/appearance', {
        params: { id: project.id },
        body,
        silent: true,
      })
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      toast.success('Aparência do projeto atualizada')
      onSaved(result.data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className='mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 md:px-6'>
      <Button
        render={<Link to={projectDetailsRoute(project.id)} />}
        variant='ghost'
        className='w-fit'
      >
        <ArrowLeft /> Voltar ao projeto
      </Button>
      <div>
        <h1 className='text-2xl font-semibold'>Personalizar projeto</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Ícone, cor principal e thumbnail de {project.projectName}.
        </p>
      </div>
      <form onSubmit={(event) => void save(event)} className='grid gap-5'>
        <Card>
          <CardHeader>
            <CardTitle>Cor principal</CardTitle>
          </CardHeader>
          <CardContent className='flex items-end gap-3'>
            <label className='grid gap-2 text-sm font-medium'>
              Selecionar cor
              <Input
                type='color'
                value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#2563EB'}
                onChange={(event) => {
                  setColor(event.target.value)
                  setColorChanged(true)
                }}
                className='h-10 w-16 cursor-pointer p-1'
              />
            </label>
            <label className='grid flex-1 gap-2 text-sm font-medium'>
              HEX
              <Input
                value={color}
                onChange={(event) => {
                  setColor(event.target.value)
                  setColorChanged(true)
                }}
                maxLength={7}
                placeholder='#2563EB'
              />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ícone</CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-4'>
            {iconPreview ? (
              <img
                src={iconPreview}
                alt='Prévia do ícone'
                className='size-16 shrink-0 rounded-lg object-cover'
              />
            ) : (
              <Box className='size-16 shrink-0 text-muted-foreground' />
            )}
            <label className='grid flex-1 gap-2 text-sm font-medium'>
              Escolher imagem do ícone
              <Input
                type='file'
                accept='image/png,image/jpeg,image/webp,image/gif,image/svg+xml'
                onChange={(event) => setIconFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Thumbnail</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3'>
            {thumbnailPreview ? (
              <img
                src={thumbnailPreview}
                alt='Prévia da thumbnail'
                className='aspect-video w-full rounded-lg object-cover'
              />
            ) : (
              <div className='grid aspect-video place-items-center rounded-lg border border-dashed text-muted-foreground'>
                <ImageIcon className='size-10' />
              </div>
            )}
            <label className='grid gap-2 text-sm font-medium'>
              Escolher thumbnail
              <Input
                type='file'
                accept='image/png,image/jpeg,image/webp,image/gif,image/svg+xml'
                onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </CardContent>
        </Card>
        {error && (
          <p role='alert' className='text-sm text-destructive'>
            {error}
          </p>
        )}
        <div className='flex justify-end gap-2'>
          <Button render={<Link to={projectDetailsRoute(project.id)} />} variant='outline'>
            Cancelar
          </Button>
          <Button type='submit' disabled={saving || (!colorChanged && !iconFile && !thumbnailFile)}>
            {saving ? 'Salvando…' : 'Salvar aparência'}
          </Button>
        </div>
      </form>
    </section>
  )
}

export function ProjectCustomizePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const user = useUser((state) => state.user)
  const navigate = useNavigate()
  const { data: project, isLoading, error, mutate } = useGet('/projects/:id', projectId)

  if (isLoading)
    return (
      <section className='p-6' aria-busy='true'>
        <Skeleton className='h-64 w-full' />
      </section>
    )
  if (error || !project)
    return (
      <section role='alert' className='p-6'>
        Projeto não encontrado.
      </section>
    )
  if (user?.role !== 'student' || !project.members?.some((member) => member.id === user.id)) {
    return (
      <section role='alert' className='p-6'>
        Você não tem permissão para personalizar este projeto.
      </section>
    )
  }

  return (
    <ProjectCustomizeContent
      key={project.id}
      project={project}
      onSaved={(updated) => {
        void mutate(updated, { revalidate: false }).then(() =>
          navigate(projectDetailsRoute(project.id))
        )
      }}
    />
  )
}
