import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { ActivityPipeline as ActivityPipelineData } from '@/types/activity'
import { ActivityPipeline } from './activity-pipeline'

const pipeline: ActivityPipelineData = {
  metrics: { notViewed: 25, viewed: 50, submitted: 25 },
  columns: {
    not_viewed: [],
    viewed: [],
    submitted: [],
    evaluated: [],
  },
}

describe('ActivityPipeline', () => {
  it('keeps the board scrollable on narrow screens', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ActivityPipeline activityId='activity-1' pipeline={pipeline} />
      </MemoryRouter>
    )

    expect(html).toContain('overflow-x-auto')
    expect(html).toContain('min-w-72')
  })
})
