import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Activity } from '@/types/activity'
import {
  createSubmissionFilePreviewUrl,
  getSelectedFileNames,
  removeSelectedFile,
  SubmissionForm,
} from './submission-form'

vi.mock('@/api', () => ({
  useList: () => ({ data: [{ id: 'repository-1', url: 'https://github.com/carecahub/web' }] }),
}))

const activity: Activity = {
  id: 'activity-1',
  title: 'Relatório final',
  description: 'Envie o relatório em PDF.',
  dueAt: '2026-12-31T23:59:00.000Z',
  allowLateSubmissions: false,
  submissionType: 'files',
  createdById: 'teacher-1',
  publishedAt: '2026-11-24T10:00:00.000Z',
  deadlineRevision: 1,
  archivedAt: null,
  createdAt: '2026-11-24T10:00:00.000Z',
  updatedAt: '2026-11-24T10:00:00.000Z',
  attachments: [],
}

describe('SubmissionForm', () => {
  it('creates a browser preview URL for a selected file', () => {
    const url = createSubmissionFilePreviewUrl(new Blob(['conteúdo']))

    expect(url).toMatch(/^blob:/)
    URL.revokeObjectURL(url)
  })

  it('lists the selected local file names', () => {
    const files = [{ name: 'relatorio-final.pdf' } as File, { name: 'diagramas.pdf' } as File]

    expect(getSelectedFileNames(files)).toEqual(['relatorio-final.pdf', 'diagramas.pdf'])
  })

  it('removes only the selected local file', () => {
    const firstFile = { name: 'relatorio-final.pdf' } as File
    const secondFile = { name: 'diagramas.pdf' } as File

    expect(removeSelectedFile([firstFile, secondFile], 0)).toEqual([secondFile])
  })

  it('shows PDF selection as a clear clickable upload area', () => {
    const html = renderToStaticMarkup(
      <SubmissionForm
        activity={activity}
        formId='activity-submission-activity-1'
        onSubmitted={() => undefined}
      />
    )

    expect(html).toContain('<form id="activity-submission-activity-1"')
    expect(html).toContain('type="file"')
    expect(html).toContain('Clique para selecionar arquivos')
    expect(html).toContain('Máximo de 10 arquivos PDF')
    expect(html).toContain('border-dashed')
  })

  it('uses the shadcn checkbox for repository selection', () => {
    const html = renderToStaticMarkup(
      <SubmissionForm
        activity={{ ...activity, submissionType: 'links' }}
        onSubmitted={() => undefined}
      />
    )

    expect(html).toContain('data-slot="checkbox"')
    expect(html).toContain('https://github.com/carecahub/web')
  })
})
