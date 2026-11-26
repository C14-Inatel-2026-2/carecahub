import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Activity } from '@/types/activity'
import { ActivityCard } from './activity-card'

const activity: Activity = {
  id: 'activity-1',
  title: 'Protótipo navegável',
  description: '<p>Entregue o protótipo da solução.</p>',
  dueAt: '2026-10-17T20:00:00.000Z',
  allowLateSubmissions: true,
  submissionType: 'both',
  createdById: 'teacher-1',
  publishedAt: '2026-10-10T20:00:00.000Z',
  deadlineRevision: 0,
  archivedAt: null,
  createdAt: '2026-10-10T20:00:00.000Z',
  updatedAt: '2026-10-10T20:00:00.000Z',
  attachments: [
    { id: 'attachment-1', filename: 'rubrica.pdf', mimeType: 'application/pdf', size: 1024 },
  ],
}

function renderActivityCard(overrides: Partial<Activity> = {}) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ActivityCard activity={{ ...activity, ...overrides }} />
    </MemoryRouter>
  )
}

describe('ActivityCard', () => {
  it('renders the activity information and details link', () => {
    const html = renderActivityCard()

    expect(html).toContain('Protótipo navegável')
    expect(html).toContain('Entregue o protótipo da solução.')
    expect(html).toContain('Links e arquivos')
    expect(html).toContain('Entrega em atraso permitida')
    expect(html).toContain('17 de outubro de 2026')
    expect(html).toContain('1 anexo')
    expect(html).toContain('href="/activities/activity-1"')
    expect(html).toContain('Ver detalhes')
  })

  it('identifies activities that do not accept late submissions', () => {
    const html = renderActivityCard({ allowLateSubmissions: false, attachments: [] })

    expect(html).toContain('Entrega em atraso bloqueada')
    expect(html).toContain('Sem anexos')
  })
})
