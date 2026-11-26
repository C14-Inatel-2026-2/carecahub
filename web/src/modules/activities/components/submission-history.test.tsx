import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ActivitySubmission } from '@/types/activity'
import { SubmissionHistory } from './submission-history'

const submission: ActivitySubmission = {
  id: 'submission-1',
  groupId: 'group-1',
  version: 1,
  isLate: false,
  invalidatedAt: null,
  submittedAt: '2026-10-19T10:00:00.000Z',
  score: null,
  submittedBy: { id: 'student-1', name: 'Ana' },
  links: [
    {
      id: 'link-1',
      url: 'https://github.com/acme/api',
      thumbnailUrl: 'https://repository-images.githubusercontent.com/1/preview',
    },
  ],
  files: [],
}

describe('SubmissionHistory', () => {
  it('shows a square GitHub social preview beside a submitted repository link', () => {
    const html = renderToStaticMarkup(
      <SubmissionHistory
        activityId='activity-1'
        canEvaluate={false}
        onUpdated={() => undefined}
        submissions={[submission]}
      />
    )

    expect(html).toContain('src="https://repository-images.githubusercontent.com/1/preview"')
    expect(html).toContain('size-10')
    expect(html).toContain('https://github.com/acme/api')
  })
})
