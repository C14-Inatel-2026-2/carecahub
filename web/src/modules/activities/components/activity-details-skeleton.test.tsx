import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ActivityDetailsSkeleton } from './activity-details-skeleton'

describe('ActivityDetailsSkeleton', () => {
  it('renders metric cards and pipeline columns while the activity loads', () => {
    const html = renderToStaticMarkup(<ActivityDetailsSkeleton />)

    expect((html.match(/h-20/g) ?? []).length).toBe(3)
    expect((html.match(/min-w-56/g) ?? []).length).toBe(5)
    expect((html.match(/h-16/g) ?? []).length).toBeGreaterThanOrEqual(5)
  })

  it('can omit the staff-only pipeline for students', () => {
    const html = renderToStaticMarkup(<ActivityDetailsSkeleton showPipeline={false} />)

    expect(html).not.toContain('min-w-56')
  })
})
