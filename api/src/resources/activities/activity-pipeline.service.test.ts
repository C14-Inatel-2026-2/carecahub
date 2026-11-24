import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { calculatePipelineMetrics } from './activity.service'

describe('calculatePipelineMetrics', () => {
  it('rounds group delivery percentages to the nearest integer', () => {
    assert.deepEqual(
      calculatePipelineMetrics([
        'not_viewed',
        'viewed',
        'submitted',
        'evaluated',
        'submitted',
        'viewed',
      ]),
      { viewed: 83, submitted: 50, notViewed: 17 },
    )
  })
})
