import { matchRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProjectDetailsPage } from '@/modules/projects/project-details-page'
import { appRouterRoutes } from './route-config'
import { projectDetailsRoute } from './routes'

describe('appRouterRoutes', () => {
  it('resolves a project card destination to the project details page', () => {
    const matches = matchRoutes(appRouterRoutes, projectDetailsRoute('project-1'))

    expect(matches?.at(-1)?.route.Component).toBe(ProjectDetailsPage)
  })
})
