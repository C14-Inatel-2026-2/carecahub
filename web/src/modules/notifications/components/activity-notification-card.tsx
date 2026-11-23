import { Bell, CalendarClock, FilePlus2, Pencil, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { activityDetailsRoute } from '@/router/routes'
import type { Notification } from '@/types/notification'

const messages = {
  activity_published: 'publicou uma nova atividade.',
  activity_updated: 'atualizou a atividade.',
  activity_deadline_week: 'lembrou que faltam 7 dias para a entrega.',
  activity_deadline_three_days: 'lembrou que faltam 3 dias para a entrega.',
  activity_deadline_today: 'lembrou que a entrega vence hoje.',
  activity_submission_created: 'registrou uma entrega do seu grupo.',
} as const

const presentation = {
  activity_published: {
    label: 'Nova atividade',
    Icon: FilePlus2,
    className: 'bg-primary/10 text-primary',
  },
  activity_updated: {
    label: 'Atividade atualizada',
    Icon: Pencil,
    className: 'bg-blue-500/10 text-blue-600',
  },
  activity_deadline_week: {
    label: 'Lembrete de prazo',
    Icon: CalendarClock,
    className: 'bg-amber-500/10 text-amber-700',
  },
  activity_deadline_three_days: {
    label: 'Lembrete de prazo',
    Icon: CalendarClock,
    className: 'bg-amber-500/10 text-amber-700',
  },
  activity_deadline_today: {
    label: 'Entrega vence hoje',
    Icon: Bell,
    className: 'bg-destructive/10 text-destructive',
  },
  activity_submission_created: {
    label: 'Entrega registrada',
    Icon: Send,
    className: 'bg-emerald-500/10 text-emerald-700',
  },
} as const

export function ActivityNotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: Notification
  onMarkAsRead: (notification: Notification) => void
}) {
  if (!notification.activity || notification.type === 'group_invite') return null
  const { Icon, label, className } = presentation[notification.type]
  return (
    <article className='rounded-lg border bg-card p-4 shadow-sm'>
      <div className='flex gap-3'>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${className}`}
        >
          <Icon className='size-5' />
        </span>
        <div>
          <p className='text-xs font-medium text-muted-foreground'>{label}</p>
          <p className='font-medium'>{notification.activity.title}</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            {notification.actor?.name ?? 'CarecaHub'} {messages[notification.type]}
          </p>
        </div>
      </div>
      <div className='mt-4 flex justify-end gap-2'>
        <Button
          render={<Link to={activityDetailsRoute(notification.activity.id)} />}
          size='sm'
          variant='outline'
        >
          Abrir atividade
        </Button>
        {!notification.readAt && (
          <Button size='sm' variant='ghost' onClick={() => onMarkAsRead(notification)}>
            Marcar como lida
          </Button>
        )}
      </div>
    </article>
  )
}
