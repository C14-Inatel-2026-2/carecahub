import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NotificationNavLabel } from './app-sidebar'

describe('NotificationNavLabel', () => {
  it('announces the unread quantity to assistive technology', () => {
    const html = renderToStaticMarkup(<NotificationNavLabel unreadCount={3} />)

    expect(html).toContain('aria-label="3 notificações não lidas"')
  })
})
