import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { NotificationNavLabel } from '@/components/layout/app-sidebar'
import { pagesByRole } from '@/components/layout/auth-layout'
import { appRoutes } from '@/router/routes'
import type { Notification } from '@/types/notification'
import { GroupInviteNotificationCard } from './components/group-invite-notification-card'
import { NotificationsList } from './notifications-page'

const notification = (status: Notification['groupInvite'] extends infer _T ? string : never) =>
  ({
    id: 'notification-1',
    type: 'group_invite',
    readAt: null,
    createdAt: '2026-09-30T12:00:00.000Z',
    updatedAt: '2026-09-30T12:00:00.000Z',
    groupInvite: {
      id: 'invite-1',
      status,
      respondedAt: null,
      group: { id: 'group-1', friendlyId: 'Grupo 1' },
      inviter: { id: 'leader-1', name: 'Leader' },
    },
  }) as Notification

describe('notifications presentation', () => {
  it('offers accept, reject, and mark-read actions for an unread pending invitation', () => {
    const html = renderToStaticMarkup(
      <GroupInviteNotificationCard
        notification={notification('pending')}
        isBusy={false}
        onRespond={vi.fn()}
        onMarkAsRead={vi.fn()}
      />
    )

    expect(html).toContain('Aceitar')
    expect(html).toContain('Recusar')
    expect(html).toContain('Marcar como lida')
  })

  it('shows final status without response actions', () => {
    const html = renderToStaticMarkup(
      <GroupInviteNotificationCard
        notification={{ ...notification('accepted'), readAt: '2026-09-30T13:00:00.000Z' }}
        isBusy={false}
        onRespond={vi.fn()}
        onMarkAsRead={vi.fn()}
      />
    )

    expect(html).toContain('Aceito')
    expect(html).not.toContain('>Aceitar<')
    expect(html).not.toContain('Recusar')
  })

  it('renders an explicit empty inbox', () => {
    const html = renderToStaticMarkup(
      <NotificationsList
        notifications={[]}
        busyId={null}
        onRespond={vi.fn()}
        onMarkAsRead={vi.fn()}
      />
    )

    expect(html).toContain('Nenhuma notificação')
  })

  it('allows every role to open notifications', () => {
    for (const pages of Object.values(pagesByRole)) {
      expect(pages).toContain(appRoutes.notifications)
    }
  })

  it('shows a bounded unread count in the sidebar label', () => {
    expect(renderToStaticMarkup(<NotificationNavLabel unreadCount={3} />)).toContain('3')
    expect(renderToStaticMarkup(<NotificationNavLabel unreadCount={120} />)).toContain('99+')
  })
})
