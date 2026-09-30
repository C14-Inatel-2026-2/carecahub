import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useList } from '@/api'
import { writer } from '@/api/writer'
import { Skeleton } from '@/components/ui/skeleton'
import { isMockAPIEnabled } from '@/mocks/config'
import { useUser } from '@/stores/use-user'
import type { GroupInviteResponseStatus, Notification } from '@/types/notification'
import { GroupInviteNotificationCard } from './components/group-invite-notification-card'
import {
  filterNotifications,
  type NotificationFilter,
  NotificationsToolbar,
} from './components/notifications-toolbar'

const notificationsQuery = { skip: 0, take: 100 } as const

export function NotificationsPage() {
  const loadUser = useUser((state) => state.loadUser)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const { data, unreadCount, isLoading, error, mutate } = useList({
    endpoint: '/notifications',
    params: notificationsQuery,
    disabled: isMockAPIEnabled,
  })

  async function respond(notification: Notification, status: GroupInviteResponseStatus) {
    if (!notification.groupInvite) return
    setBusyId(notification.id)
    const result = await writer('PATCH /notifications/group-invites/:id/respond', {
      params: { id: notification.groupInvite.id },
      body: { status },
      onSuccessMessage: status === 'accepted' ? 'Convite aceito' : 'Convite recusado',
    })
    if (result.ok) {
      await mutate()
      if (status === 'accepted') await loadUser()
    }
    setBusyId(null)
  }

  async function markAsRead(notification: Notification) {
    setBusyId(notification.id)
    const result = await writer('PATCH /notifications/:id/read', {
      params: { id: notification.id },
      body: undefined,
      silent: true,
    })
    if (result.ok) await mutate()
    setBusyId(null)
  }

  async function markAllAsRead() {
    setIsMarkingAll(true)
    try {
      const result = await writer('PATCH /notifications/read-all', {
        body: undefined,
        onSuccessMessage: 'Todas as notificações foram marcadas como lidas',
      })
      if (result.ok) await mutate()
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <section className='flex w-full flex-1 flex-col px-4 py-5 md:px-6 lg:px-8'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-lg font-medium'>Notificações</h1>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Acompanhe convites e avisos da sua conta.
          </p>
        </div>
        <NotificationsToolbar
          filter={filter}
          unreadCount={unreadCount}
          isMarkingAll={isMarkingAll}
          onFilterChange={setFilter}
          onMarkAllAsRead={() => void markAllAsRead()}
        />
      </div>
      <div className='mt-7 border-t pt-7'>
        {isLoading ? (
          <div className='grid gap-3'>
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-32 w-full' />
          </div>
        ) : error ? (
          <p className='rounded-lg border border-destructive/30 p-5 text-sm text-destructive'>
            Não foi possível carregar as notificações.
          </p>
        ) : (
          <NotificationsList
            notifications={filterNotifications(data, filter)}
            busyId={busyId}
            onRespond={(notification, status) => void respond(notification, status)}
            onMarkAsRead={(notification) => void markAsRead(notification)}
          />
        )}
      </div>
    </section>
  )
}

export function NotificationsList({
  notifications,
  busyId,
  onRespond,
  onMarkAsRead,
}: {
  notifications: Notification[]
  busyId: string | null
  onRespond: (notification: Notification, status: GroupInviteResponseStatus) => void
  onMarkAsRead: (notification: Notification) => void
}) {
  if (notifications.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 py-16 text-center'>
        <Bell className='size-9 text-muted-foreground' />
        <p className='font-medium'>Nenhuma notificação</p>
        <p className='text-sm text-muted-foreground'>Seus novos avisos aparecerão aqui.</p>
      </div>
    )
  }

  return (
    <div className='grid gap-3'>
      {notifications.map((notification) => (
        <GroupInviteNotificationCard
          key={notification.id}
          notification={notification}
          isBusy={busyId === notification.id}
          onRespond={onRespond}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  )
}
