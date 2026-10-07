import { matchRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProjectDetailsPage } from '@/modules/projects/project-details-page'
import { ProjectCustomizePage } from '@/modules/projects/project-customize-page'
import { appRouterRoutes } from './route-config'
import { projectCustomizeRoute, projectDetailsRoute } from './routes'

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
})
