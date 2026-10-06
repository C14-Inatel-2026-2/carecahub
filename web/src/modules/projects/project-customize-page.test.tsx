import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Project } from '@/types/project'
import { projectAppearanceSchema } from '@/types/project'
import { ProjectCustomizeContent } from './project-customize-page'

const project = {
  id: 'project-1',
  projectName: 'CarecaHub',
  repositories: [],
  commitCount: 0,
  branchCount: 0,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  iconUrl: 'https://example.com/icon.png',
  thumbnailUrl: 'https://example.com/thumbnail.png',
  mainColor: '#123ABC',
} as Project

describe('ProjectCustomizeContent', () => {
  it('shows saved appearance and separate file controls', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ProjectCustomizeContent project={project} onSaved={vi.fn()} />
      </MemoryRouter>
    )

    expect(html).toContain('Personalizar projeto')
    expect(html).toContain('value="#123ABC"')
    expect(html).toContain('src="https://example.com/icon.png"')
    expect(html).toContain('src="https://example.com/thumbnail.png"')
    expect(html.match(/type="file"/g)).toHaveLength(2)
  })

  it('accepts only six-digit HEX colors', () => {
    expect(projectAppearanceSchema.safeParse({ mainColor: '#12AB34' }).success).toBe(true)
    expect(projectAppearanceSchema.safeParse({ mainColor: '#123' }).success).toBe(false)
    expect(projectAppearanceSchema.safeParse({ mainColor: '#ZZZZZZ' }).success).toBe(false)
  })
})
