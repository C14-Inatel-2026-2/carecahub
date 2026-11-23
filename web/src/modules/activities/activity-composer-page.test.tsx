import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import {
  ActivityComposerPage,
  appendActivityAttachments,
  createActivityAttachmentPreviewUrl,
  getDefaultActivityDueDate,
} from './activity-composer-page'

describe('ActivityComposerPage', () => {
  it('appends newly selected attachments without replacing existing ones', () => {
    const firstAttachment = { name: 'referencia.pdf' } as File
    const secondAttachment = { name: 'rubrica.pdf' } as File

    expect(appendActivityAttachments([firstAttachment], [secondAttachment])).toEqual([
      firstAttachment,
      secondAttachment,
    ])
  })

  it('creates a browser preview URL for a selected attachment', () => {
    const file = new Blob(['conteúdo'])
    const url = createActivityAttachmentPreviewUrl(file)

    expect(url).toMatch(/^blob:/)
    URL.revokeObjectURL(url)
  })

  it('defaults the due date to one week after the current local date', () => {
    expect(getDefaultActivityDueDate(new Date(2026, 9, 8, 14))).toBe('2026-10-15')
  })

  it('renders a Teams-inspired authoring layout with student preview', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ActivityComposerPage />
      </MemoryRouter>
    )

    expect(html).toContain('Nova atividade')
    expect(html).toContain('Visão do aluno')
    expect(html).toContain('Publicar atividade')
    expect(html).toContain('aria-label="Negrito"')
    expect(html).toContain('aria-label="Itálico"')
    expect(html).toContain('aria-label="Lista com marcadores"')
    expect(html).toContain('data-slot="activity-rich-text-editor"')
    expect(html).toContain('Escreva as instruções para os alunos')
    expect(html).toContain('aria-label="Selecionar anexos"')
    expect(html).toContain('lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]')
    expect(html).toContain('aria-label="Selecionar data de entrega"')
    expect(html).toContain('aria-label="Selecionar horário de entrega"')
    expect(html).toContain('23:59')
    expect(html).toContain('aria-label="Tipo de entrega"')
    expect(html).toContain('Links e arquivos')
    expect(html).toContain('aria-label="Permitir entregas em atraso"')
    expect(html).toContain('data-slot="checkbox"')
    expect(html).toContain('role="button"')
  })
})
