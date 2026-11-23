import {
  Calendar as CalendarIcon,
  CircleAlert,
  Clock,
  Eye,
  File,
  FileText,
  Paperclip,
  Pencil,
  TextQuote,
  Trash2,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { appRoutes } from '@/router/routes'
import type { ActivitySubmissionType } from '@/types/activity'
import { ActivityRichTextContent, ActivityRichTextEditor } from './components/activity-rich-text'

const submissionTypeLabels: Record<ActivitySubmissionType, string> = {
  links: 'Links',
  files: 'Arquivos PDF',
  both: 'Links e arquivos',
}

const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const minuteOptions = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'))

export function appendActivityAttachments(current: File[], selected: File[]) {
  return [...current, ...selected].slice(0, 10)
}

export function createActivityAttachmentPreviewUrl(file: Blob) {
  return URL.createObjectURL(file)
}

export function getDefaultActivityDueDate(currentDate = new Date()) {
  const dueDate = new Date(currentDate)
  dueDate.setDate(dueDate.getDate() + 7)

  const year = dueDate.getFullYear()
  const month = String(dueDate.getMonth() + 1).padStart(2, '0')
  const day = String(dueDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseActivityDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return year && month && day ? new Date(year, month - 1, day) : undefined
}

function formatActivityDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ActivityComposerPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(getDefaultActivityDueDate)
  const [dueTime, setDueTime] = useState('23:59')
  const [submissionType, setSubmissionType] = useState<ActivitySubmissionType>('both')
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [publishing, setPublishing] = useState(false)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const dueAt = dueDate && dueTime ? `${dueDate}T${dueTime}` : ''
  const [dueHour, dueMinute] = dueTime.split(':')

  function previewAttachment(file: File) {
    const url = createActivityAttachmentPreviewUrl(file)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  async function publish() {
    if (!title.trim() || !description.trim() || !dueAt)
      return toast.error('Preencha título, instruções e prazo.')
    setPublishing(true)
    const attachmentIds: string[] = []
    for (const file of attachments) {
      const form = new FormData()
      form.append('file', file)
      const upload = await writer('POST /files/private', {
        body: form,
        silent: true,
      })
      if (!upload.ok) {
        setPublishing(false)
        return toast.error(upload.error.message)
      }
      attachmentIds.push(upload.data.id)
    }
    const result = await writer('POST /activities', {
      body: {
        title: title.trim(),
        description: description.trim(),
        dueAt: new Date(dueAt).toISOString(),
        submissionType,
        allowLateSubmissions,
        attachmentIds,
      },
      silent: true,
    })
    setPublishing(false)
    if (!result.ok) return toast.error(result.error.message)
    toast.success('Atividade publicada')
    navigate(`/activities/${result.data.id}`)
  }

  return (
    <main className='flex min-h-full flex-col bg-background'>
      <header className='flex h-14 items-center border-b px-5'>
        <Link
          className='text-sm text-muted-foreground hover:text-foreground'
          to={appRoutes.activities}
        >
          Atividades
        </Link>
        <span className='mx-3 text-muted-foreground'>/</span>
        <h1 className='font-medium'>Nova atividade</h1>
      </header>
      <div className='grid w-full flex-1 gap-8 px-5 py-7 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:px-10'>
        <section className='w-full'>
          <div className='flex flex-row gap-4 items-center justify-start w-full'>
            <Pencil />
            <Input
              aria-label='Título da atividade'
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder='Título da atividade'
              className='h-12 border-0 bg-muted text-lg font-medium shadow-none focus-visible:ring-1'
            />
          </div>
          <div className='flex flex-row gap-4 items-start justify-start w-full mt-4'>
            <TextQuote />
            <div className='w-full'>
              <div className='w-full overflow-hidden rounded-lg border bg-card'>
                <ActivityRichTextEditor value={description} onChange={setDescription} />
              </div>
              <div className='mt-4 flex flex-col flex-wrap items-start w-full gap-3'>
                {attachments.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className='flex items-center justify-between w-full gap-4 p-2 rounded bg-muted border border-muted-foreground/20'
                  >
                    <button
                      type='button'
                      className='flex flex-1 flex-row items-center gap-2 px-2 py-1 text-left text-base leading-tight hover:text-primary'
                      aria-label={`Visualizar ${file.name}`}
                      onClick={() => previewAttachment(file)}
                    >
                      <File className='size-5' />
                      {file.name}
                    </button>
                    <Button
                      variant='ghost'
                      className='text-destructive hover:text-destructive'
                      type='button'
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((_, position) => position !== index)
                        )
                      }
                    >
                      <Trash2 className='size-5' />
                    </Button>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  className='inline-flex cursor-pointer items-center gap-2 text-sm text-primary'
                  aria-label='Selecionar anexos'
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  <Paperclip className='size-4' />
                  Anexar
                </Button>
                <input
                  ref={attachmentInputRef}
                  className='hidden'
                  type='file'
                  multiple
                  onChange={(event) => {
                    const selected = Array.from(event.target.files ?? [])
                    setAttachments((current) => appendActivityAttachments(current, selected))
                    event.currentTarget.value = ''
                  }}
                />
              </div>
            </div>
          </div>
        </section>
        <aside className='space-y-4'>
          <div>
            <div className='grid gap-4'>
              <div className='grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3'>
                <CalendarIcon className='size-5 text-muted-foreground' aria-hidden='true' />
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type='button'
                        variant='outline'
                        className='w-full justify-start font-normal'
                        aria-label='Selecionar data de entrega'
                      />
                    }
                  >
                    {parseActivityDate(dueDate)?.toLocaleDateString('pt-BR')}
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={parseActivityDate(dueDate)}
                      onSelect={(date) => date && setDueDate(formatActivityDate(date))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3'>
                <Clock className='size-5 text-muted-foreground' aria-hidden='true' />
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type='button'
                        variant='outline'
                        className='w-full justify-start font-normal'
                        aria-label='Selecionar horário de entrega'
                      />
                    }
                  >
                    {dueTime}
                  </PopoverTrigger>
                  <PopoverContent className='w-56' align='start'>
                    <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-2'>
                      <Select
                        value={dueHour}
                        onValueChange={(hour) => setDueTime(`${hour}:${dueMinute}`)}
                      >
                        <SelectTrigger aria-label='Hora de entrega' className='w-full'>
                          <span data-slot='select-value'>{dueHour}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {hourOptions.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span aria-hidden='true'>:</span>
                      <Select
                        value={dueMinute}
                        onValueChange={(minute) => setDueTime(`${dueHour}:${minute}`)}
                      >
                        <SelectTrigger aria-label='Minuto de entrega' className='w-full'>
                          <span data-slot='select-value'>{dueMinute}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map((minute) => (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className='grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3'>
                <FileText className='size-5 text-muted-foreground' aria-hidden='true' />
                <Select
                  value={submissionType}
                  onValueChange={(value) => setSubmissionType(value as ActivitySubmissionType)}
                >
                  <SelectTrigger className='w-full' aria-label='Tipo de entrega'>
                    <span data-slot='select-value'>{submissionTypeLabels[submissionType]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='links'>Links</SelectItem>
                    <SelectItem value='files'>Arquivos PDF</SelectItem>
                    <SelectItem value='both'>Links e arquivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3'>
                <CircleAlert className='size-5 text-muted-foreground' aria-hidden='true' />
                <label
                  role='button'
                  tabIndex={0}
                  className='flex min-h-8 cursor-pointer items-center gap-2 text-sm'
                  onClick={() => setAllowLateSubmissions((current) => !current)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setAllowLateSubmissions((current) => !current)
                    }
                  }}
                >
                  <Checkbox
                    aria-label='Permitir entregas em atraso'
                    checked={allowLateSubmissions}
                    onCheckedChange={setAllowLateSubmissions}
                    onClick={(event) => event.stopPropagation()}
                  />
                  Permitir entregas em atraso
                </label>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <footer className='sticky bottom-0 flex items-center justify-between border-t bg-background px-5 py-3'>
        <Dialog>
          <DialogTrigger render={<Button variant='ghost' />}>
            <Eye />
            Visão do aluno
          </DialogTrigger>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Visão do aluno</DialogTitle>
            </DialogHeader>
            <Card>
              <CardContent className='pt-5'>
                <h2 className='text-lg font-medium'>{title || 'Título da atividade'}</h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Prazo: {dueAt ? new Date(dueAt).toLocaleString('pt-BR') : 'Não definido'}
                </p>
                <div className='mt-5'>
                  {description ? (
                    <ActivityRichTextContent content={description} />
                  ) : (
                    <p className='text-sm'>As instruções aparecerão aqui.</p>
                  )}
                </div>
                <div className='mt-5 text-sm'>
                  {attachments.map((file) => (
                    <p key={file.name}>{file.name}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => navigate(appRoutes.activities)}>
            Descartar
          </Button>
          <Button variant='highlight' disabled={publishing} onClick={() => void publish()}>
            {publishing ? 'Publicando…' : 'Publicar atividade'}
          </Button>
        </div>
      </footer>
    </main>
  )
}
