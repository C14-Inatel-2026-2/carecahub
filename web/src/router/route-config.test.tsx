import { matchRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ActivityGroupDeliveryPage } from '@/modules/activities/activity-group-delivery-page'
import { ProjectCustomizePage } from '@/modules/projects/project-customize-page'
import { ProjectDetailsPage } from '@/modules/projects/project-details-page'
import { appRouterRoutes } from './route-config'
import { activityGroupDeliveryRoute, projectCustomizeRoute, projectDetailsRoute } from './routes'

describe('appRouterRoutes', () => {
  it('resolves a project card destination to the project details page', () => {
    const matches = matchRoutes(appRouterRoutes, projectDetailsRoute('Meu Projeto'))

    expect(matches?.at(-1)?.route.Component).toBe(ProjectDetailsPage)
    expect(projectDetailsRoute('Meu Projeto')).toBe('/projects/Meu%20Projeto')
  })

  it('resolves the project customization destination', () => {
    const matches = matchRoutes(appRouterRoutes, projectCustomizeRoute('project-1'))
    expect(matches?.at(-1)?.route.Component).toBe(ProjectCustomizePage)
  })

  it('builds a group delivery destination with encoded activity and group ids', () => {
    expect(activityGroupDeliveryRoute('activity id', 'group/id')).toBe(
      '/activities/activity%20id/groups/group%2Fid'
    )
  })

  it('resolves a pipeline row destination to the group delivery details page', () => {
    const matches = matchRoutes(appRouterRoutes, '/activities/activity-1/groups/group-1')

    expect(matches?.at(-1)?.route.Component).toBe(ActivityGroupDeliveryPage)
  })
})
