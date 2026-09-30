import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Notification } from '@/types/notification'

export type NotificationFilter = 'all' | 'unread' | 'read'

export function filterNotifications(notifications: Notification[], filter: NotificationFilter) {
  if (filter === 'unread') return notifications.filter((notification) => !notification.readAt)
  if (filter === 'read') return notifications.filter((notification) => notification.readAt)
  return notifications
}

export function NotificationsToolbar({
  filter,
  unreadCount,
  isMarkingAll,
  onFilterChange,
  onMarkAllAsRead,
}: {
  filter: NotificationFilter
  unreadCount: number
  isMarkingAll: boolean
  onFilterChange: (filter: NotificationFilter) => void
  onMarkAllAsRead: () => void
}) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Tabs value={filter} onValueChange={(value) => onFilterChange(value as NotificationFilter)}>
        <TabsList aria-label='Filtrar notificações'>
          <TabsTrigger value='all'>Todas</TabsTrigger>
          <TabsTrigger value='unread'>Não lidas</TabsTrigger>
          <TabsTrigger value='read'>Lidas</TabsTrigger>
        </TabsList>
      </Tabs>
      <Button
        type='button'
        variant='outline'
        disabled={unreadCount === 0 || isMarkingAll}
        onClick={onMarkAllAsRead}
      >
        {isMarkingAll ? 'Marcando…' : 'Marcar todas como lidas'}
      </Button>
    </div>
  )
}
