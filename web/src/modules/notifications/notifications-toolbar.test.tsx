import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Notification } from '@/types/notification'
import {
  filterNotifications,
  type NotificationFilter,
  NotificationsToolbar,
} from './components/notifications-toolbar'

const unread = { id: 'unread', readAt: null } as Notification
const read = { id: 'read', readAt: '2026-09-30T13:00:00.000Z' } as Notification

describe('notifications toolbar', () => {
  it.each<[NotificationFilter, string[]]>([
    ['all', ['unread', 'read']],
    ['unread', ['unread']],
    ['read', ['read']],
  ])('filters %s notifications', (filter, expectedIds) => {
    expect(filterNotifications([unread, read], filter).map(({ id }) => id)).toEqual(expectedIds)
  })

  it('renders all filters and the mark-all action', () => {
    const html = renderToStaticMarkup(
      <NotificationsToolbar
        filter='all'
        unreadCount={2}
        isMarkingAll={false}
        onFilterChange={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />
    )

    expect(html).toContain('Todas')
    expect(html).toContain('Não lidas')
    expect(html).toContain('Lidas')
    expect(html).toContain('Marcar todas como lidas')
  })

  it('disables mark-all when there are no unread notifications', () => {
    const html = renderToStaticMarkup(
      <NotificationsToolbar
        filter='all'
        unreadCount={0}
        isMarkingAll={false}
        onFilterChange={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />
    )

    expect(html).toMatch(/<button[^>]*disabled[^>]*>Marcar todas como lidas<\/button>/)
  })
})
