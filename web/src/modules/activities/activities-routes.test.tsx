import { matchRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { pagesByRole } from '@/components/layout/auth-layout'
import { appRouterRoutes } from '@/router/route-config'
import { activityDetailsRoute, appRoutes } from '@/router/routes'
import { ActivitiesPage } from './activities-page'
import { ActivityDetailsPage } from './activity-details-page'

describe('activity routes', () => {
  it('resolves the activity list and details pages', () => {
    expect(matchRoutes(appRouterRoutes, appRoutes.activities)?.at(-1)?.route.Component).toBe(
      ActivitiesPage
    )
    expect(
      matchRoutes(appRouterRoutes, activityDetailsRoute('activity-1'))?.at(-1)?.route.Component
    ).toBe(ActivityDetailsPage)
  })

  it('lets every role open the activities page', () => {
    for (const pages of Object.values(pagesByRole)) {
      expect(pages).toContain(appRoutes.activities)
    }
  })
})
