import { Check, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GroupInviteResponseStatus, Notification } from '@/types/notification'

const statusLabels = {
  pending: 'Pendente',
  accepted: 'Aceito',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
} as const

export function GroupInviteNotificationCard({
  notification,
  isBusy,
  onRespond,
  onMarkAsRead,
}: {
  notification: Notification
  isBusy: boolean
  onRespond: (notification: Notification, status: GroupInviteResponseStatus) => void
  onMarkAsRead: (notification: Notification) => void
}) {
  const invite = notification.groupInvite
  if (!invite) return null

  return (
    <article
      className='rounded-lg border bg-card p-4 shadow-sm'
      aria-label={`Convite para ${invite.group.friendlyId}`}
    >
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 gap-3'>
          <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-muted'>
            <Users className='size-5 text-muted-foreground' />
          </span>
          <div className='min-w-0'>
            <p className='font-medium'>Convite para {invite.group.friendlyId}</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {invite.inviter.name} convidou você para participar do grupo.
            </p>
          </div>
        </div>
        <Badge variant={invite.status === 'pending' ? 'secondary' : 'outline'}>
          {statusLabels[invite.status]}
        </Badge>
      </div>

      <div className='mt-4 flex flex-wrap justify-end gap-2'>
        {!notification.readAt && (
          <Button
            type='button'
            size='sm'
            variant='ghost'
            disabled={isBusy}
            onClick={() => onMarkAsRead(notification)}
          >
            Marcar como lida
          </Button>
        )}
        {invite.status === 'pending' && (
          <>
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={isBusy}
              onClick={() => onRespond(notification, 'rejected')}
            >
              <X /> Recusar
            </Button>
            <Button
              type='button'
              size='sm'
              disabled={isBusy}
              onClick={() => onRespond(notification, 'accepted')}
            >
              <Check /> Aceitar
            </Button>
          </>
        )}
      </div>
    </article>
  )
}
