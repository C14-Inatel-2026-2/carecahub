import { ArrowRight, CalendarClock, ClipboardCheck, FileText, Paperclip } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getFriendlyDate } from '@/lib/utils'
import { activityDetailsRoute } from '@/router/routes'
import type { Activity } from '@/types/activity'
import { activityRichTextToPlainText } from './activity-rich-text'

const submissionTypeLabels = {
  links: 'Links',
  files: 'Arquivos PDF',
  both: 'Links e arquivos',
} as const

export function ActivityCard({ activity }: { activity: Activity }) {
  const attachmentLabel = activity.attachments.length
    ? `${activity.attachments.length} ${activity.attachments.length === 1 ? 'anexo' : 'anexos'}`
    : 'Sem anexos'

  return (
    <article className='flex h-full flex-col gap-2 rounded-sm border border-border/70 bg-card p-5 shadow-lg/40 shadow-foreground/10'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-highlight-soft text-highlight-soft-foreground'>
            <ClipboardCheck className='size-5' />
          </div>
          <h2 className='truncate font-medium'>{activity.title}</h2>
        </div>
        <Badge variant='secondary'>{submissionTypeLabels[activity.submissionType]}</Badge>
      </div>

      <p className='line-clamp-2 min-h-10 text-sm text-muted-foreground'>
        {activityRichTextToPlainText(activity.description)}
      </p>

      <dl className='grid gap-3 py-2 text-sm'>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <CalendarClock className='size-4 shrink-0' />
          <div>
            <dt className='text-xs'>Prazo de entrega</dt>
            <dd className='font-medium text-foreground'>
              {getFriendlyDate(new Date(activity.dueAt), 'dd/mm/yyyy - hh:mm')}
            </dd>
          </div>
        </div>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <FileText className='size-4 shrink-0' />
          <div>
            <dt className='text-xs'>Status de entrega</dt>
            <dd className='font-medium text-foreground'>
              {activity.allowLateSubmissions
                ? 'Entrega em atraso permitida'
                : 'Entrega em atraso bloqueada'}
            </dd>
          </div>
        </div>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <Paperclip className='size-4 shrink-0' />
          <div>
            <dt className='text-xs'>Materiais de referência</dt>
            <dd className='font-medium text-foreground'>{attachmentLabel}</dd>
          </div>
        </div>
      </dl>

      <Button
        className='mt-auto'
        render={<Link to={activityDetailsRoute(activity.id)} />}
        variant='outline'
      >
        Ver detalhes
        <ArrowRight />
      </Button>
    </article>
  )
}
